const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Announcement = require('../models/Announcement');
const fs = require('fs');

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/announcements';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece ses dosyaları yüklenebilir'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Yeni anons oluştur
router.post('/', upload.single('audioFile'), async (req, res) => {
  console.log('Yeni anons isteği alındı:', req.body);
  let uploadedFile = null;

  try {
    if (!req.file) {
      throw new Error('Ses dosyası zorunludur');
    }
    uploadedFile = req.file;

    // Form verilerini doğrula
    if (!req.body.title || !req.body.content || !req.body.duration) {
      throw new Error('Eksik form alanları');
    }

    // Tarih alanlarını kontrol et
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Geçersiz tarih formatı');
    }

    if (endDate <= startDate) {
      throw new Error('Bitiş tarihi başlangıç tarihinden sonra olmalıdır');
    }

    // Anons verilerini hazırla
    const announcementData = {
      title: req.body.title,
      content: req.body.content,
      audioFile: req.file.path,
      duration: parseFloat(req.body.duration),
      startDate: startDate,
      endDate: endDate,
      scheduleType: req.body.scheduleType,
      status: 'active',
      createdBy: 'system'
    };

    // Zamanlama tipine göre ek alanları ekle
    if (req.body.scheduleType === 'interval') {
      if (!req.body.interval || isNaN(req.body.interval)) {
        throw new Error('Geçersiz aralık değeri');
      }
      announcementData.minuteInterval = parseInt(req.body.interval);
    } else if (req.body.scheduleType === 'specific') {
      if (!req.body['specificTimes[]']) {
        throw new Error('En az bir saat belirtilmelidir');
      }
      announcementData.specificTimes = Array.isArray(req.body['specificTimes[]'])
        ? req.body['specificTimes[]']
        : [req.body['specificTimes[]']];
    }

    // Hedef cihaz ve grupları ekle
    announcementData.targetDevices = Array.isArray(req.body['targetDevices[]'])
      ? req.body['targetDevices[]']
      : req.body['targetDevices[]']
        ? [req.body['targetDevices[]']]
        : [];

    announcementData.targetGroups = Array.isArray(req.body['targetGroups[]'])
      ? req.body['targetGroups[]']
      : req.body['targetGroups[]']
        ? [req.body['targetGroups[]']]
        : [];

    // En az bir hedef seçilmiş olmalı
    if (announcementData.targetDevices.length === 0 && announcementData.targetGroups.length === 0) {
      throw new Error('En az bir hedef cihaz veya grup seçilmelidir');
    }

    console.log('Oluşturulacak anons:', announcementData);

    // Anonsu kaydet
    const announcement = new Announcement(announcementData);
    const savedAnnouncement = await announcement.save();
    
    console.log('Anons başarıyla oluşturuldu:', savedAnnouncement._id);
    res.status(201).json(savedAnnouncement);
  } catch (error) {
    console.error('Anons oluşturma hatası:', error);
    
    // Hata durumunda yüklenen dosyayı temizle
    if (uploadedFile) {
      fs.unlink(uploadedFile.path, (err) => {
        if (err) console.error('Dosya silinirken hata:', err);
      });
    }

    res.status(400).json({
      message: error.message,
      validationErrors: error.errors
    });
  }
});

// Tüm anosları getir
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('targetDevices')
      .populate('targetGroups')
      .sort('-createdAt');
    res.json(announcements);
  } catch (error) {
    console.error('Anosları getirme hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// Belirli bir cihaz için aktif anosları getir
router.get('/device/:deviceId', async (req, res) => {
  try {
    const now = new Date();
    const deviceAnnouncements = await Announcement.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { targetDevices: req.params.deviceId },
        { targetGroups: { $in: await getDeviceGroupIds(req.params.deviceId) } }
      ]
    });
    
    res.json(deviceAnnouncements);
  } catch (error) {
    console.error('Cihaz anoslarını getirme hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// Yardımcı fonksiyon: Cihazın grup ID'lerini getir
async function getDeviceGroupIds(deviceId) {
  const Device = require('../models/Device');
  const device = await Device.findById(deviceId);
  return device ? [device.groupId] : [];
}

module.exports = router;
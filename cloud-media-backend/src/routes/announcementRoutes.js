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
      createdBy: 'system',
      immediateInterrupt: req.body.immediateInterrupt === 'true'
    };

    // Zamanlama tipine göre ek alanları ekle
    if (req.body.scheduleType === 'songs') {
      if (!req.body.songInterval || isNaN(req.body.songInterval)) {
        throw new Error('Geçersiz şarkı aralığı değeri');
      }
      announcementData.songInterval = parseInt(req.body.songInterval);
    } else if (req.body.scheduleType === 'minutes') {
      if (!req.body.minuteInterval || isNaN(req.body.minuteInterval)) {
        throw new Error('Geçersiz dakika aralığı değeri');
      }
      announcementData.minuteInterval = parseInt(req.body.minuteInterval);
    } else if (req.body.scheduleType === 'specific') {
      if (!req.body['specificTimes[]']) {
        throw new Error('En az bir saat belirtilmelidir');
      }
      announcementData.specificTimes = Array.isArray(req.body['specificTimes[]'])
        ? req.body['specificTimes[]']
        : [req.body['specificTimes[]']];
    }

    // Hedef cihaz ve grupları ekle
    const targetDevices = req.body['targetDevices[]'] || req.body.targetDevices;
    const targetGroups = req.body['targetGroups[]'] || req.body.targetGroups;

    announcementData.targetDevices = Array.isArray(targetDevices)
      ? targetDevices
      : targetDevices
        ? [targetDevices]
        : [];

    announcementData.targetGroups = Array.isArray(targetGroups)
      ? targetGroups
      : targetGroups
        ? [targetGroups]
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

// Update existing announcement
router.put('/:id', upload.single('audioFile'), async (req, res) => {
  console.log('Anons güncelleme isteği alındı:', req.body);
  let uploadedFile = null;

  try {
    const announcementId = req.params.id;
    const existingAnnouncement = await Announcement.findById(announcementId);
    
    if (!existingAnnouncement) {
      throw new Error('Anons bulunamadı');
    }

    // Form verilerini doğrula
    if (!req.body.title || !req.body.content) {
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

    // Güncelleme verilerini hazırla
    const updateData = {
      title: req.body.title,
      content: req.body.content,
      startDate: startDate,
      endDate: endDate,
      scheduleType: req.body.scheduleType,
      status: 'active',
      immediateInterrupt: req.body.immediateInterrupt === 'true'
    };

    // Eğer yeni ses dosyası yüklendiyse
    if (req.file) {
      uploadedFile = req.file;
      updateData.audioFile = req.file.path;
      updateData.duration = parseFloat(req.body.duration);
      
      // Eski ses dosyasını sil
      if (existingAnnouncement.audioFile) {
        fs.unlink(existingAnnouncement.audioFile, (err) => {
          if (err) console.error('Eski ses dosyası silinirken hata:', err);
        });
      }
    }

    // Zamanlama tipine göre ek alanları ekle
    if (req.body.scheduleType === 'songs') {
      if (!req.body.songInterval || isNaN(req.body.songInterval)) {
        throw new Error('Geçersiz şarkı aralığı değeri');
      }
      updateData.songInterval = parseInt(req.body.songInterval);
      updateData.minuteInterval = null;
      updateData.specificTimes = [];
    } else if (req.body.scheduleType === 'minutes') {
      if (!req.body.minuteInterval || isNaN(req.body.minuteInterval)) {
        throw new Error('Geçersiz dakika aralığı değeri');
      }
      updateData.minuteInterval = parseInt(req.body.minuteInterval);
      updateData.songInterval = null;
      updateData.specificTimes = [];
    } else if (req.body.scheduleType === 'specific') {
      if (!req.body.specificTimes) {
        throw new Error('En az bir saat belirtilmelidir');
      }
      updateData.specificTimes = Array.isArray(req.body.specificTimes) 
        ? req.body.specificTimes 
        : [req.body.specificTimes];
      updateData.songInterval = null;
      updateData.minuteInterval = null;
    }

    // Hedef cihaz ve grupları güncelle
    let targetDevices = req.body.targetDevices;
    let targetGroups = req.body.targetGroups;

    // targetDevices'ı düzgün bir array'e dönüştür
    if (typeof targetDevices === 'string') {
      try {
        targetDevices = JSON.parse(targetDevices);
      } catch (e) {
        targetDevices = [targetDevices];
      }
    }
    
    // targetGroups'u düzgün bir array'e dönüştür
    if (typeof targetGroups === 'string') {
      try {
        targetGroups = JSON.parse(targetGroups);
      } catch (e) {
        targetGroups = [targetGroups];
      }
    }

    // Array içindeki string'leri temizle ve geçerli ID'leri al
    updateData.targetDevices = Array.isArray(targetDevices) 
      ? targetDevices.map(id => typeof id === 'object' ? id._id || id.id : id).filter(Boolean)
      : [];

    updateData.targetGroups = Array.isArray(targetGroups)
      ? targetGroups.map(id => typeof id === 'object' ? id._id || id.id : id).filter(Boolean)
      : [];

    // En az bir hedef seçilmiş olmalı
    if (updateData.targetDevices.length === 0 && updateData.targetGroups.length === 0) {
      throw new Error('En az bir hedef cihaz veya grup seçilmelidir');
    }

    // Anonsu güncelle
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      announcementId,
      updateData,
      { new: true }
    );
    
    console.log('Anons başarıyla güncellendi:', updatedAnnouncement._id);
    res.json(updatedAnnouncement);
  } catch (error) {
    console.error('Anons güncelleme hatası:', error);
    
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

module.exports = router;

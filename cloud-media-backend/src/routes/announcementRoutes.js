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
    // Klasör yoksa oluştur
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
  }
});

// Tüm anosları getir
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('targetDevices')
      .populate('targetGroups');
    res.json(announcements);
  } catch (error) {
    console.error('Anosları getirme hatası:', error);
    res.status(500).json({ message: error.message });
  }
});

// Yeni anons oluştur
router.post('/', upload.single('audioFile'), async (req, res) => {
  console.log('Yeni anons isteği alındı');
  console.log('Form verileri:', req.body);
  console.log('Dosya bilgisi:', req.file);

  let uploadedFile = null;

  try {
    if (!req.file) {
      throw new Error('Ses dosyası zorunludur');
    }
    uploadedFile = req.file;

    // Array verilerini parse et
    const targetDevices = req.body['targetDevices[]'] 
      ? Array.isArray(req.body['targetDevices[]'])
        ? req.body['targetDevices[]']
        : [req.body['targetDevices[]']]
      : [];

    const targetGroups = req.body['targetGroups[]']
      ? Array.isArray(req.body['targetGroups[]'])
        ? req.body['targetGroups[]']
        : [req.body['targetGroups[]']]
      : [];

    const specificTimes = req.body['specificTimes[]']
      ? Array.isArray(req.body['specificTimes[]'])
        ? req.body['specificTimes[]']
        : [req.body['specificTimes[]']]
      : [];

    console.log('İşlenmiş array verileri:', {
      targetDevices,
      targetGroups,
      specificTimes
    });

    const announcementData = {
      title: req.body.title,
      content: req.body.content,
      audioFile: req.file.path,
      duration: parseFloat(req.body.duration),
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      scheduleType: req.body.scheduleType,
      songInterval: req.body.songInterval ? parseInt(req.body.songInterval) : null,
      minuteInterval: req.body.minuteInterval ? parseInt(req.body.minuteInterval) : null,
      immediateInterrupt: req.body.immediateInterrupt === 'true',
      specificTimes: specificTimes,
      targetDevices: targetDevices,
      targetGroups: targetGroups,
      createdBy: req.body.createdBy || 'system'
    };

    console.log('Oluşturulacak anons verileri:', announcementData);

    const announcement = new Announcement(announcementData);
    const newAnnouncement = await announcement.save();
    
    console.log('Anons başarıyla oluşturuldu:', newAnnouncement._id);
    res.status(201).json(newAnnouncement);
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

// Belirli bir cihaz için çalınması gereken anosları getir
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

// Yardımcı fonksiyon: Cihazın bağlı olduğu grup ID'sini getir
async function getDeviceGroupIds(deviceId) {
  const Device = require('../models/Device');
  const device = await Device.findById(deviceId);
  return device ? [device.groupId] : [];
}

module.exports = router;
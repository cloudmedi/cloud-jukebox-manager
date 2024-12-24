const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Announcement = require('../models/Announcement');

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/announcements');
  },
  filename: function (req, file, cb) {
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
  console.log('Gelen form verileri:', req.body);
  console.log('Gelen dosya:', req.file);

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Ses dosyası zorunludur' });
    }

    // Array verilerini düzgün şekilde parse et
    const targetDevices = Array.isArray(req.body['targetDevices[]']) 
      ? req.body['targetDevices[]'] 
      : req.body['targetDevices[]'] 
        ? [req.body['targetDevices[]']] 
        : [];

    const targetGroups = Array.isArray(req.body['targetGroups[]'])
      ? req.body['targetGroups[]']
      : req.body['targetGroups[]']
        ? [req.body['targetGroups[]']]
        : [];

    const specificTimes = Array.isArray(req.body['specificTimes[]'])
      ? req.body['specificTimes[]']
      : req.body['specificTimes[]']
        ? [req.body['specificTimes[]']]
        : [];

    console.log('Parse edilmiş veriler:', {
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

    console.log('İşlenmiş anons verileri:', announcementData);

    const announcement = new Announcement(announcementData);
    const newAnnouncement = await announcement.save();
    
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Anons oluşturma hatası:', error);
    // Hata durumunda yüklenen dosyayı temizle
    if (req.file) {
      const fs = require('fs');
      fs.unlink(req.file.path, (err) => {
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
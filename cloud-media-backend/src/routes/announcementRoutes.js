const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// Tüm anosları getir
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('targetDevices')
      .populate('targetGroups');
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Belirli bir anosu getir
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('targetDevices')
      .populate('targetGroups');
    if (!announcement) {
      return res.status(404).json({ message: 'Anons bulunamadı' });
    }
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni anons oluştur
router.post('/', async (req, res) => {
  console.log('Yeni anons isteği alındı:', {
    body: req.body,
    files: req.files,
    headers: req.headers
  });

  const announcement = new Announcement({
    title: req.body.title,
    content: req.body.content,
    audioFile: req.body.audioFile,
    duration: req.body.duration,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    scheduleType: req.body.scheduleType,
    songInterval: req.body.songInterval,
    minuteInterval: req.body.minuteInterval,
    immediateInterrupt: req.body.immediateInterrupt,
    specificTimes: req.body.specificTimes,
    targetDevices: req.body.targetDevices,
    targetGroups: req.body.targetGroups,
    createdBy: req.body.createdBy
  });

  try {
    console.log('Anons modeli oluşturuldu:', announcement);
    const newAnnouncement = await announcement.save();
    console.log('Anons başarıyla kaydedildi:', newAnnouncement);
    res.status(201).json(newAnnouncement);
  } catch (error) {
    console.error('Anons oluşturma hatası:', error);
    res.status(400).json({ 
      message: error.message,
      validationErrors: error.errors,
      stack: error.stack
    });
  }
});

// Anons güncelle
router.patch('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Anons bulunamadı' });
    }

    const allowedUpdates = [
      'title',
      'content',
      'audioFile',
      'duration',
      'startDate',
      'endDate',
      'scheduleType',
      'songInterval',
      'minuteInterval',
      'immediateInterrupt',
      'specificTimes',
      'targetDevices',
      'targetGroups',
      'status'
    ];

    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        announcement[update] = req.body[update];
      }
    });

    const updatedAnnouncement = await announcement.save();
    res.json(updatedAnnouncement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Anons sil
router.delete('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Anons bulunamadı' });
    }
    await announcement.remove();
    res.json({ message: 'Anons silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Aktif anosları getir
router.get('/active/now', async (req, res) => {
  try {
    const now = new Date();
    const activeAnnouncements = await Announcement.find({
      status: 'active',
      startDate: { $lte: now },
      endDate: { $gte: now }
    })
    .populate('targetDevices')
    .populate('targetGroups');
    
    res.json(activeAnnouncements);
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    res.status(500).json({ message: error.message });
  }
});

// Yardımcı fonksiyon: Cihazın bağlı olduğu grupların ID'lerini getir
async function getDeviceGroupIds(deviceId) {
  const Device = require('../models/Device');
  const device = await Device.findById(deviceId);
  return device ? device.groups : [];
}

module.exports = router;

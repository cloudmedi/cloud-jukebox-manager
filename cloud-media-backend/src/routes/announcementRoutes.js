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
  const announcement = new Announcement({
    title: req.body.title,
    content: req.body.content,
    audioFile: req.body.audioFile,
    duration: req.body.duration,
    priority: req.body.priority,
    schedule: req.body.schedule,
    targetDevices: req.body.targetDevices,
    targetGroups: req.body.targetGroups,
    createdBy: req.body.createdBy
  });

  try {
    const newAnnouncement = await announcement.save();
    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Anons güncelle
router.patch('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Anons bulunamadı' });
    }

    Object.keys(req.body).forEach(key => {
      announcement[key] = req.body[key];
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
      'schedule.startDate': { $lte: now },
      'schedule.endDate': { $gte: now }
    }).populate('targetDevices').populate('targetGroups');
    
    res.json(activeAnnouncements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
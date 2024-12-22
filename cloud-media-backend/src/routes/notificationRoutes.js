const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// Tüm bildirimleri getir
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tüm bildirimleri okundu olarak işaretle
router.post('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany(
      { read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'Tüm bildirimler okundu olarak işaretlendi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni bildirim oluştur (sistem içi kullanım için)
router.post('/', async (req, res) => {
  try {
    const notification = new Notification({
      type: req.body.type,
      title: req.body.title,
      message: req.body.message,
      read: false
    });
    const newNotification = await notification.save();
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const PlaylistSchedule = require('../models/PlaylistSchedule');

// Tüm zamanlamaları getir
router.get('/', async (req, res) => {
  try {
    const schedules = await PlaylistSchedule.find()
      .populate('playlist')
      .populate('targets.devices')
      .populate('targets.groups');
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Belirli bir zamanlamayı getir
router.get('/:id', async (req, res) => {
  try {
    const schedule = await PlaylistSchedule.findById(req.params.id)
      .populate('playlist')
      .populate('targets.devices')
      .populate('targets.groups');
    if (!schedule) {
      return res.status(404).json({ message: 'Zamanlama bulunamadı' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni zamanlama oluştur
router.post('/', async (req, res) => {
  console.log('[Schedule] Creating new schedule:', req.body);
  
  const schedule = new PlaylistSchedule({
    playlist: req.body.playlist,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    repeatType: req.body.repeatType,
    targets: {
      devices: req.body.targets.devices || [],
      groups: req.body.targets.groups || []
    },
    createdBy: req.body.createdBy
  });

  try {
    const hasConflict = await schedule.checkConflict();
    if (hasConflict) {
      console.log('[Schedule] Conflict detected for new schedule');
      return res.status(400).json({
        message: "Bu zaman aralığında çakışan başka bir zamanlama mevcut"
      });
    }

    const newSchedule = await schedule.save();
    console.log('[Schedule] New schedule created:', newSchedule._id);

    // WebSocket üzerinden hedef cihazlara bildir
    if (req.wss && req.wss.scheduleHandler) {
      console.log('[Schedule] Broadcasting via WebSocket. WSS:', !!req.wss, 'ScheduleHandler:', !!req.wss.scheduleHandler);
      const result = await req.wss.scheduleHandler.handleSendSchedule(newSchedule);
      console.log('[Schedule] Broadcast result:', result);
    } else {
      console.log('[Schedule] WebSocket not available:', { wss: !!req.wss, scheduleHandler: req.wss ? !!req.wss.scheduleHandler : false });
    }

    res.status(201).json(newSchedule);
  } catch (error) {
    console.error('[Schedule] Error creating schedule:', error);
    res.status(400).json({ message: error.message });
  }
});

// Schedule güncelleme
router.patch('/:id', async (req, res) => {
  try {
    const schedule = await PlaylistSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Sadece gönderilen alanları güncelle
    if (req.body.startDate) schedule.startDate = req.body.startDate;
    if (req.body.endDate) schedule.endDate = req.body.endDate;
    if (req.body.playlist) schedule.playlist = req.body.playlist;
    if (req.body.repeatType) schedule.repeatType = req.body.repeatType;
    if (req.body.targets) {
      schedule.targets = {
        devices: req.body.targets.devices || schedule.targets.devices || [],
        groups: req.body.targets.groups || schedule.targets.groups || []
      };
    }

    // Çakışma kontrolü
    const hasConflict = await schedule.checkConflict();
    if (hasConflict) {
      return res.status(400).json({
        message: "Bu zaman aralığında çakışan başka bir zamanlama mevcut"
      });
    }

    const updatedSchedule = await schedule.save();

    // WebSocket üzerinden hedef cihazlara bildir
    if (req.wss && req.wss.scheduleHandler) {
      await req.wss.scheduleHandler.handleScheduleUpdate(updatedSchedule);
    }

    res.json(updatedSchedule);
  } catch (error) {
    console.error('[Schedule] Error updating schedule:', error);
    res.status(400).json({ message: error.message });
  }
});

// Schedule güncelleme (PUT metodu - geriye dönük uyumluluk için)
router.put('/:id', async (req, res) => {
  try {
    const updatedSchedule = await PlaylistSchedule.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          playlist: req.body.playlist,
          startDate: req.body.startDate,
          endDate: req.body.endDate,
          repeatType: req.body.repeatType,
          targets: {
            devices: req.body.targets.devices || [],
            groups: req.body.targets.groups || []
          }
        }
      },
      { new: true }
    );

    if (!updatedSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // WebSocket üzerinden hedef cihazlara bildir
    if (req.wss && req.wss.scheduleHandler) {
      await req.wss.scheduleHandler.handleScheduleUpdate(updatedSchedule);
    }

    res.json(updatedSchedule);
  } catch (error) {
    console.error('[Schedule] Error updating schedule:', error);
    res.status(400).json({ message: error.message });
  }
});

// Schedule silme
router.delete('/:id', async (req, res) => {
  try {
    const schedule = await PlaylistSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // WebSocket üzerinden hedef cihazlara bildir
    if (req.wss && req.wss.scheduleHandler) {
      await req.wss.scheduleHandler.handleScheduleDelete(schedule);
    }

    // Schedule'ı sil
    await PlaylistSchedule.deleteOne({ _id: req.params.id });

    res.json({ message: "Schedule deleted successfully" });
  } catch (error) {
    console.error('[Schedule] Error deleting schedule:', error);
    res.status(500).json({ message: error.message });
  }
});

// Aktif zamanlamaları getir
router.get('/active/now', async (req, res) => {
  try {
    const now = new Date();
    const activeSchedules = await PlaylistSchedule.find({
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: 'active'
    })
    .populate('playlist')
    .populate('targets.devices')
    .populate('targets.groups');
    
    res.json(activeSchedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

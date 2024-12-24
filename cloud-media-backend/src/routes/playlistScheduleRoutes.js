const express = require('express');
const router = express.Router();
const PlaylistSchedule = require('../models/PlaylistSchedule');

// Get all schedules
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

// Get specific schedule
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

// Create new schedule
router.post('/', async (req, res) => {
  const schedule = new PlaylistSchedule({
    playlist: req.body.playlist,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate),
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
      return res.status(400).json({ 
        message: 'Bu zaman aralığında seçili cihaz veya gruplar için başka bir zamanlama mevcut' 
      });
    }

    const newSchedule = await schedule.save();
    res.status(201).json(newSchedule);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update schedule
router.patch('/:id', async (req, res) => {
  try {
    const schedule = await PlaylistSchedule.findById(req.params.id);
    if (!schedule) {
      return res.status(404).json({ message: 'Zamanlama bulunamadı' });
    }

    if (req.body.startDate) req.body.startDate = new Date(req.body.startDate);
    if (req.body.endDate) req.body.endDate = new Date(req.body.endDate);

    const updatedSchedule = Object.assign(schedule, req.body);
    const hasConflict = await updatedSchedule.checkConflict();
    if (hasConflict) {
      return res.status(400).json({ 
        message: 'Bu zaman aralığında seçili cihaz veya gruplar için başka bir zamanlama mevcut' 
      });
    }

    const result = await updatedSchedule.save();
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete schedule - UPDATED to use deleteOne instead of remove
router.delete('/:id', async (req, res) => {
  try {
    const result = await PlaylistSchedule.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Zamanlama bulunamadı' });
    }
    res.json({ message: 'Zamanlama silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active schedules
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
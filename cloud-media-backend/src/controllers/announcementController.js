const Announcement = require('../models/Announcement');
const DeleteMessage = require('../websocket/messages/DeleteMessage');
const DeleteService = require('../services/DeleteService');
const { createLogger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const logger = createLogger('announcement-controller');

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find();
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  const announcement = new Announcement({
    name: req.body.name,
    audioFile: req.body.audioFile,
  });

  try {
    const newAnnouncement = await announcement.save();
    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateAnnouncement = async (req, res) => {
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
};

const deleteAnnouncement = async (req, res) => {
  try {
    logger.info(`Starting announcement deletion process for ID: ${req.params.id}`);
    
    const deleteService = new DeleteService(req.wss);
    
    await deleteService.handleDelete('announcement', req.params.id, async () => {
      const announcement = await Announcement.findById(req.params.id);
      if (!announcement) {
        throw new Error('Anons bulunamadı');
      }

      // Ses dosyasını sil
      if (announcement.audioFile) {
        const audioPath = path.join('uploads', 'announcements', announcement.audioFile);
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
          logger.info(`Deleted audio file: ${audioPath}`);
        }
      }

      // Cihazlara bildirim gönder
      announcement.targetDevices.forEach(deviceId => {
        req.wss.sendToDevice(deviceId, 
          DeleteMessage.createDeleteStarted('announcement', announcement._id)
        );
      });

      // Anonsu sil
      await Announcement.findByIdAndDelete(announcement._id);
      logger.info(`Successfully deleted announcement: ${announcement._id}`);

      // Başarılı silme bildirimi gönder
      announcement.targetDevices.forEach(deviceId => {
        req.wss.sendToDevice(deviceId,
          DeleteMessage.createDeleteSuccess('announcement', announcement._id)
        );
      });
    });

    res.json({ 
      message: 'Anons başarıyla silindi',
      status: 'success'
    });

  } catch (error) {
    logger.error('Announcement deletion error:', error);
    res.status(500).json({ 
      message: error.message || 'Anons silinirken bir hata oluştu',
      status: 'error'
    });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
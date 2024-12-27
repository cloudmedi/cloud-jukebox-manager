const Announcement = require('../models/Announcement');
const DeleteMessage = require('../websocket/messages/DeleteMessage');
const { createLogger } = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const DeleteService = require('../services/DeleteService');

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
    
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      logger.warn(`Announcement not found with ID: ${req.params.id}`);
      return res.status(404).json({ 
        message: 'Anons bulunamadı',
        status: 'error' 
      });
    }

    const deleteService = new DeleteService(req.wss);
    await deleteService.handleDelete('announcement', announcement._id, async () => {
      // Ses dosyasını sil
      if (announcement.audioFile) {
        const audioPath = path.join('uploads', 'announcements', announcement.audioFile);
        try {
          if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
            logger.info(`Deleted audio file: ${audioPath}`);
          }
        } catch (error) {
          logger.error('Error deleting audio file:', error);
        }
      }

      // Anonsu veritabanından sil
      await Announcement.findByIdAndDelete(announcement._id);
      logger.info(`Successfully deleted announcement: ${announcement._id}`);

      // Cihazlara DeleteMessage formatında bildirim gönder
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
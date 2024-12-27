const Announcement = require('../models/Announcement');
const DeleteMessage = require('../websocket/messages/DeleteMessage');
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
    
    // Önce anonsu bul
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      logger.warn(`Announcement not found with ID: ${req.params.id}`);
      return res.status(404).json({ 
        message: 'Anons bulunamadı',
        status: 'error' 
      });
    }

    try {
      // Silme başladı bildirimi
      req.wss.broadcastToAdmins(
        DeleteMessage.createDeleteStarted('announcement', req.params.id, {
          announcementName: announcement.name
        })
      );
    } catch (error) {
      logger.error('Broadcast error:', error);
      // Hata olsa bile devam et
    }

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
        // Dosya silinmese bile devam et
      }
    }

    // Cihazlara bildirim gönder
    try {
      req.wss.broadcast({
        type: 'delete',
        entityType: 'announcement',
        entityId: announcement._id
      });
    } catch (error) {
      logger.error('Broadcast error:', error);
      // Bildirim hatası olsa bile devam et
    }

    // Anonsu sil
    try {
      await Announcement.findByIdAndDelete(announcement._id);
      logger.info(`Successfully deleted announcement: ${announcement._id}`);
    } catch (error) {
      logger.error('Error deleting announcement:', error);
      throw error; // Bu hatayı fırlat çünkü kritik bir işlem
    }

    try {
      // Başarılı silme bildirimi
      req.wss.broadcastToAdmins(
        DeleteMessage.createDeleteSuccess('announcement', announcement._id, {
          announcementName: announcement.name
        })
      );
    } catch (error) {
      logger.error('Success broadcast error:', error);
      // Bildirim hatası olsa bile devam et
    }

    res.json({ 
      message: 'Anons başarıyla silindi',
      status: 'success'
    });

  } catch (error) {
    logger.error('Announcement deletion error:', error);
    
    try {
      req.wss.broadcastToAdmins(
        DeleteMessage.createDeleteError('announcement', req.params.id, error)
      );
    } catch (broadcastError) {
      logger.error('Error broadcast failed:', broadcastError);
    }
    
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

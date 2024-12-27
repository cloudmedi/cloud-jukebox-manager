const express = require('express');
const Announcement = require('../models/Announcement');
const Device = require('../models/Device');
const { createLogger } = require('../utils/logger');
const DeleteService = require('../services/DeleteService');
const DeleteMessage = require('../websocket/messages/DeleteMessage');
const fs = require('fs');
const path = require('path');

const logger = createLogger('announcement-controller');

const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  
  try {
    logger.info(`Starting announcement deletion process for ID: ${id}`);
    
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      logger.warn(`Announcement not found with ID: ${id}`);
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Anons silme işlemini DeleteService ile gerçekleştir
    const deleteService = new DeleteService(req.wss);
    await deleteService.handleDelete('announcement', announcement._id, async () => {
      // Ses dosyasını sil
      if (announcement.localPath) {
        const audioPath = path.join('uploads', 'announcements', path.basename(announcement.localPath));
        if (fs.existsSync(audioPath)) {
          fs.unlinkSync(audioPath);
          logger.info(`Deleted audio file: ${audioPath}`);
        }
      }

      // Veritabanından sil
      await Announcement.findByIdAndDelete(id);
      logger.info(`Announcement deleted from database: ${id}`);

      // Tüm cihazlara silme mesajı gönder
      const devices = await Device.find();
      devices.forEach(device => {
        try {
          if (device.wsConnection) {
            const deleteMessage = DeleteMessage.createDeleteSuccess('announcement', id);
            device.wsConnection.send(JSON.stringify(deleteMessage));
            logger.info(`Delete message sent to device ${device._id}`);
          }
        } catch (error) {
          logger.error(`Error sending delete message to device ${device._id}:`, error);
        }
      });
    });

    res.json({ message: 'Announcement deleted successfully' });
    
  } catch (error) {
    logger.error('Error in deleteAnnouncement:', error);
    res.status(500).json({ message: 'Error deleting announcement', error: error.message });
  }
};

module.exports = {
  deleteAnnouncement,
};

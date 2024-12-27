const Song = require('../models/Song');
const songService = require('../services/songService');
const DeleteService = require('../services/DeleteService');
const NotificationService = require('../services/NotificationService');
const fs = require('fs');
const path = require('path');
const { createLogger } = require('../utils/logger');

const logger = createLogger('song-controller');

const getAllSongs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [songs, total] = await Promise.all([
      Song.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Song.countDocuments()
    ]);

    res.json({
      songs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSongById = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSong = async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }

    const allowedUpdates = [
      'name', 'artist', 'genre', 'album', 'year', 'language', 'status'
    ];

    allowedUpdates.forEach(update => {
      if (req.body[update] !== undefined) {
        song[update] = req.body[update];
      }
    });

    const updatedSong = await song.save();
    res.json(updatedSong);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteSong = async (req, res) => {
  try {
    logger.info(`Starting song deletion process for ID: ${req.params.id}`);
    
    const song = await Song.findById(req.params.id);
    if (!song) {
      logger.warn(`Song not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }

    logger.info(`Found song to delete: ${song.name} (${song._id})`);

    // DeleteService ile silme işlemini gerçekleştir
    const deleteService = new DeleteService(req.wss);
    await deleteService.handleDelete('song', song._id, async () => {
      // Dosyaları sil
      if (song.filePath && fs.existsSync(song.filePath)) {
        fs.unlinkSync(song.filePath);
        logger.info(`Deleted song file: ${song.filePath}`);
      }

      if (song.artwork) {
        const artworkPath = path.join('uploads', song.artwork);
        if (fs.existsSync(artworkPath)) {
          fs.unlinkSync(artworkPath);
          logger.info(`Deleted artwork file: ${artworkPath}`);
        }
      }

      // Bildirim oluştur
      await NotificationService.create({
        type: 'system',
        title: 'Şarkı Silindi',
        message: `"${song.name}" şarkısı başarıyla silindi.`
      });

      await song.deleteOne();
      logger.info('Song document deleted from database');
    });

    res.json({ 
      message: 'Şarkı başarıyla silindi',
      songId: song._id
    });
    
    logger.info('Song deletion process completed successfully');

  } catch (error) {
    logger.error('Error deleting song:', { 
      songId: req.params.id,
      error: error.message,
      stack: error.stack 
    });

    // Hata durumunda bildirim oluştur
    await NotificationService.create({
      type: 'system',
      title: 'Şarkı Silme Hatası',
      message: `Şarkı silinirken bir hata oluştu: ${error.message}`
    });

    res.status(500).json({ 
      message: 'Şarkı silinirken bir hata oluştu',
      error: error.message 
    });
  }
};

module.exports = {
  getAllSongs,
  getSongById,
  updateSong,
  deleteSong
};

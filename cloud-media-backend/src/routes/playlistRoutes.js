const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const Device = require('../models/Device');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('../utils/logger');

const logger = createLogger('playlist-service');

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/playlists')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'playlist-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Geçersiz dosya tipi. Sadece JPEG, JPG, PNG ve WEBP dosyaları kabul edilir.'));
    }
  }
});

// Tüm playlistleri getir
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching all playlists');
    const playlists = await Playlist.find()
      .populate('songs');
    logger.info(`Successfully fetched ${playlists.length} playlists`);
    res.json(playlists);
  } catch (error) {
    logger.error('Error fetching playlists:', { error: error.message });
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('songs');
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist bulunamadı' });
    }
    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Yeni playlist oluştur
router.post('/', upload.single('artwork'), async (req, res) => {
  try {
    const playlist = new Playlist({
      name: req.body.name,
      description: req.body.description,
      songs: req.body.songs ? (Array.isArray(req.body.songs) ? req.body.songs : [req.body.songs]) : [],
      artwork: req.file ? `/uploads/playlists/${req.file.filename}` : null,
      createdBy: req.body.createdBy || 'system',
      isShuffled: req.body.isShuffled === 'true'
    });

    const newPlaylist = await playlist.save();
    res.status(201).json(newPlaylist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Playlist güncelle
router.patch('/:id', upload.single('artwork'), async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist bulunamadı' });
    }

    if (req.file) {
      playlist.artwork = `/uploads/playlists/${req.file.filename}`;
    }

    Object.keys(req.body).forEach(key => {
      playlist[key] = req.body[key];
    });

    const updatedPlaylist = await playlist.save();
    res.json(updatedPlaylist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Playlist sil - Enhanced logging
router.delete('/:id', async (req, res) => {
  try {
    logger.info(`Starting playlist deletion process for ID: ${req.params.id}`);
    
    // Önce playlist'i bul
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      logger.warn(`Playlist not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Playlist bulunamadı' });
    }

    logger.info(`Found playlist to delete: ${playlist.name} (${playlist._id})`);

    // Bu playlist'i kullanan cihazları bul
    const affectedDevices = await Device.find({ activePlaylist: playlist._id });
    logger.info(`Found ${affectedDevices.length} devices using this playlist`);
    
    if (affectedDevices.length > 0) {
      logger.info('Affected devices:', affectedDevices.map(d => ({ id: d._id, token: d.token })));
    }

    // Cihazların playlist referanslarını temizle
    const updateResult = await Device.updateMany(
      { activePlaylist: playlist._id },
      { 
        $set: { 
          activePlaylist: null,
          playlistStatus: null 
        } 
      }
    );
    logger.info(`Updated ${updateResult.modifiedCount} devices to remove playlist reference`);

    // Artwork dosyasını sil
    if (playlist.artwork) {
      const artworkPath = path.join('uploads', 'playlists', path.basename(playlist.artwork));
      logger.info(`Checking artwork file: ${artworkPath}`);
      
      if (fs.existsSync(artworkPath)) {
        fs.unlinkSync(artworkPath);
        logger.info(`Deleted artwork file: ${artworkPath}`);
      } else {
        logger.warn(`Artwork file not found: ${artworkPath}`);
      }
    }

    // Playlist'i sil
    await Playlist.findByIdAndDelete(req.params.id);
    logger.info(`Successfully deleted playlist from database: ${playlist._id}`);

    // WebSocket üzerinden cihazlara bildirim gönder
    if (req.wss) {
      logger.info('Sending WebSocket notifications to affected devices');
      affectedDevices.forEach(device => {
        logger.info(`Sending deletion notification to device: ${device.token}`);
        req.wss.sendToDevice(device.token, {
          type: 'playlist',
          action: 'deleted',
          playlistId: playlist._id
        });
      });
    } else {
      logger.warn('WebSocket server not available for notifications');
    }

    // Başarılı yanıt döndür
    res.json({ 
      message: 'Playlist başarıyla silindi',
      affectedDevices: affectedDevices.length
    });
    logger.info('Playlist deletion process completed successfully');

  } catch (error) {
    logger.error('Error deleting playlist:', { 
      playlistId: req.params.id,
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ 
      message: 'Playlist silinirken bir hata oluştu',
      error: error.message 
    });
  }
});

module.exports = router;

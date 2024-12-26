const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    const playlists = await Playlist.find()
      .populate('songs');
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Belirli bir playlisti getir
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

// Playlist sil - Güncellendi
router.delete('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist bulunamadı' });
    }

    // Artwork dosyasını sil (eğer varsa)
    if (playlist.artwork) {
      const artworkPath = path.join('uploads', 'playlists', path.basename(playlist.artwork));
      if (fs.existsSync(artworkPath)) {
        fs.unlinkSync(artworkPath);
        console.log('Artwork dosyası silindi:', artworkPath);
      }
    }

    // findByIdAndDelete kullan - bu pre-remove middleware'i tetikleyecek
    await Playlist.findByIdAndDelete(req.params.id);

    // Başarılı yanıt döndür
    res.json({ message: 'Playlist başarıyla silindi' });
  } catch (error) {
    console.error('Playlist silme hatası:', error);
    res.status(500).json({ 
      message: 'Playlist silinirken bir hata oluştu',
      error: error.message 
    });
  }
});

module.exports = router;

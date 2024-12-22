const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Song = require('../models/Song');
const mm = require('music-metadata');

// Multer yapılandırması
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(mp3|wav|ogg)$/)) {
      return cb(new Error('Sadece ses dosyaları yüklenebilir!'));
    }
    cb(null, true);
  }
});

// Tüm şarkıları getir
router.get('/', async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Belirli bir şarkıyı getir
router.get('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }
    res.json(song);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dosya yükleme endpoint'i
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenemedi' });
    }

    // Müzik dosyasından metadata bilgilerini çıkar
    const metadata = await mm.parseFile(req.file.path);
    
    // Metadata'dan bilgileri al
    const artist = metadata.common.artist || 'Bilinmeyen Sanatçı';
    const title = metadata.common.title || req.file.originalname;
    const album = metadata.common.album || '';
    const genre = metadata.common.genre?.[0] || 'Other';
    const year = metadata.common.year || null;
    
    // Süreyi saniye cinsinden hesapla
    const duration = Math.round(metadata.format.duration || 0);

    const song = new Song({
      name: title,
      artist: artist,
      genre: genre,
      album: album,
      year: year,
      filePath: req.file.path,
      duration: duration,
      createdBy: 'system'
    });

    const newSong = await song.save();
    res.status(201).json(newSong);
  } catch (error) {
    console.error('Hata:', error);
    res.status(400).json({ message: error.message });
  }
});

// Şarkı güncelle
router.patch('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }

    const allowedUpdates = [
      'name',
      'artist',
      'genre',
      'album',
      'year',
      'language',
      'status'
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
});

// Şarkı sil
router.delete('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }
    await song.remove();
    res.json({ message: 'Şarkı silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
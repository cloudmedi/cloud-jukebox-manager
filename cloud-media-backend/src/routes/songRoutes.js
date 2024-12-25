const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const songController = require('../controllers/songController');
const songService = require('../services/songService');

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
router.get('/', songController.getAllSongs);

// Belirli bir şarkıyı getir
router.get('/:id', songController.getSongById);

// Dosya yükleme endpoint'i
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Dosya yüklenemedi' });
    }

    const newSong = await songService.handleFileUpload(req.file);
    res.status(201).json(newSong);
  } catch (error) {
    console.error('Hata:', error);
    res.status(400).json({ message: error.message });
  }
});

// Şarkı güncelle
router.patch('/:id', songController.updateSong);

// Şarkı sil
router.delete('/:id', songController.deleteSong);

module.exports = router;
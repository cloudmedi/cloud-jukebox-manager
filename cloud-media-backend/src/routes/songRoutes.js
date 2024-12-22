const express = require('express');
const router = express.Router();
const Song = require('../models/Song');

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

// Yeni şarkı oluştur
router.post('/', async (req, res) => {
  const song = new Song({
    name: req.body.name,
    artist: req.body.artist,
    genre: req.body.genre,
    album: req.body.album,
    year: req.body.year,
    language: req.body.language,
    filePath: req.body.filePath,
    duration: req.body.duration,
    createdBy: req.body.createdBy
  });

  try {
    const newSong = await song.save();
    res.status(201).json(newSong);
  } catch (error) {
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
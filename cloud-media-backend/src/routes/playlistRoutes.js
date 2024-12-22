const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');

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
router.post('/', async (req, res) => {
  const playlist = new Playlist({
    name: req.body.name,
    description: req.body.description,
    songs: req.body.songs,
    artwork: req.body.artwork,
    createdBy: req.body.createdBy,
    isShuffled: req.body.isShuffled
  });

  try {
    const newPlaylist = await playlist.save();
    res.status(201).json(newPlaylist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Playlist güncelle
router.patch('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist bulunamadı' });
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

// Playlist sil
router.delete('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist bulunamadı' });
    }
    await playlist.remove();
    res.json({ message: 'Playlist silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Playliste şarkı ekle
router.post('/:id/songs', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist bulunamadı' });
    }

    const songIds = req.body.songs;
    playlist.songs.push(...songIds);
    
    const updatedPlaylist = await playlist.save();
    res.json(updatedPlaylist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Playlistten şarkı çıkar
router.delete('/:id/songs/:songId', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist bulunamadı' });
    }

    playlist.songs = playlist.songs.filter(
      song => song.toString() !== req.params.songId
    );
    
    const updatedPlaylist = await playlist.save();
    res.json(updatedPlaylist);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
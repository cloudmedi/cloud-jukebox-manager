const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const Device = require('../models/Device');
const path = require('path');
const fs = require('fs');

// Tüm playlistleri getir
router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.find();
    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Belirli bir playlisti getir
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
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
    songs: req.body.songs || [],
    artwork: req.body.artwork || null,
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
    console.log('Playlist silme isteği alındı:', req.params.id);
    
    // Önce playlist'i bul
    const playlist = await Playlist.findById(req.params.id);
    if (!playlist) {
      console.log('Playlist bulunamadı:', req.params.id);
      return res.status(404).json({ message: 'Playlist bulunamadı' });
    }

    // Bu playlist'i kullanan cihazları bul
    const affectedDevices = await Device.find({ activePlaylist: playlist._id });
    console.log('Etkilenen cihazlar:', affectedDevices.map(d => d.token));

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
    console.log('Cihaz güncellemeleri:', updateResult);

    // Artwork dosyasını sil (eğer varsa)
    if (playlist.artwork) {
      const artworkPath = path.join('uploads', 'playlists', path.basename(playlist.artwork));
      if (fs.existsSync(artworkPath)) {
        fs.unlinkSync(artworkPath);
        console.log('Artwork dosyası silindi:', artworkPath);
      }
    }

    // Playlist'i sil
    await Playlist.findByIdAndDelete(req.params.id);
    console.log('Playlist silindi:', req.params.id);

    // WebSocket üzerinden cihazlara bildirim gönder
    if (req.app.get('wss')) {
      affectedDevices.forEach(device => {
        console.log('Cihaza silme bildirimi gönderiliyor:', device.token);
        req.app.get('wss').sendToDevice(device.token, {
          type: 'playlist',
          action: 'deleted',
          playlistId: playlist._id
        });
      });
    }

    // Başarılı yanıt döndür
    res.json({ 
      message: 'Playlist başarıyla silindi',
      affectedDevices: affectedDevices.length
    });

  } catch (error) {
    console.error('Playlist silme hatası:', error);
    res.status(500).json({ 
      message: 'Playlist silinirken bir hata oluştu',
      error: error.message 
    });
  }
});

module.exports = router;

const Song = require('../models/Song');
const songService = require('../services/songService');
const fs = require('fs');
const path = require('path');

const getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find();
    res.json(songs);
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
    console.log('Şarkı silme isteği alındı:', req.params.id);
    
    // Önce şarkıyı bul
    const song = await Song.findById(req.params.id);
    if (!song) {
      console.log('Şarkı bulunamadı:', req.params.id);
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }

    console.log('Şarkı dosyaları siliniyor...');
    // Şarkı dosyasını sil
    if (song.filePath && fs.existsSync(song.filePath)) {
      fs.unlinkSync(song.filePath);
      console.log('Şarkı dosyası silindi:', song.filePath);
    }

    // Artwork dosyasını sil
    if (song.artwork) {
      const artworkPath = path.join('uploads', song.artwork);
      if (fs.existsSync(artworkPath)) {
        fs.unlinkSync(artworkPath);
        console.log('Artwork dosyası silindi:', artworkPath);
      }
    }

    console.log('Şarkı veritabanından siliniyor...');
    // Doğrudan belge üzerinde deleteOne'ı çağır
    await song.deleteOne();
    console.log('Şarkı başarıyla silindi:', song._id);

    res.json({ message: 'Şarkı başarıyla silindi' });
  } catch (error) {
    console.error('Şarkı silme hatası:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSongs,
  getSongById,
  updateSong,
  deleteSong
};
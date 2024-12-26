const Song = require('../models/Song');
const songService = require('../services/songService');
const DeleteService = require('../services/DeleteService');
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
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ message: 'Şarkı bulunamadı' });
    }

    const deleteService = new DeleteService(req.wss);
    await deleteService.handleDelete('song', song._id, async () => {
      // Dosyaları sil
      if (song.filePath && fs.existsSync(song.filePath)) {
        fs.unlinkSync(song.filePath);
      }

      if (song.artwork) {
        const artworkPath = path.join('uploads', song.artwork);
        if (fs.existsSync(artworkPath)) {
          fs.unlinkSync(artworkPath);
        }
      }

      await song.deleteOne();
    });

    res.json({ message: 'Şarkı başarıyla silindi' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllSongs,
  getSongById,
  updateSong,
  deleteSong
};

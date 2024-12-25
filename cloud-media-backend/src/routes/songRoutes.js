const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Song = require('../models/Song');
const NodeID3 = require('node-id3');
const fs = require('fs');

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

    // ID3 etiketlerini oku
    const tags = NodeID3.read(req.file.path);
    
    // Metadata'dan bilgileri al
    const artist = tags.artist || 'Bilinmeyen Sanatçı';
    const title = tags.title || req.file.originalname;
    const album = tags.album || '';
    const genre = tags.genre || 'Other';
    const year = tags.year ? parseInt(tags.year) : null;
    
    // Artwork'ü kaydet
    let artworkPath = null;
    if (tags.image && tags.image.imageBuffer) {
      // Artwork klasörünü oluştur
      const artworkDir = path.join('uploads', 'artworks');
      if (!fs.existsSync(artworkDir)) {
        fs.mkdirSync(artworkDir, { recursive: true });
      }
      
      const artworkFileName = `artwork-${Date.now()}.jpg`;
      const artworkFullPath = path.join(artworkDir, artworkFileName);
      
      fs.writeFileSync(artworkFullPath, tags.image.imageBuffer);
      artworkPath = `/uploads/artworks/${artworkFileName}`;
    }
    
    // Varsayılan süre (gerçek süreyi almak için farklı bir kütüphane gerekebilir)
    const duration = 0;

    const song = new Song({
      name: title,
      artist: artist,
      genre: genre,
      album: album,
      year: year,
      filePath: req.file.path,
      artwork: artworkPath,
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
    console.log('Şarkı silme isteği alındı:', req.params.id);
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
    // findOneAndDelete yerine deleteOne kullan
    await Song.deleteOne({ _id: song._id });
    console.log('Şarkı başarıyla silindi:', song._id);

    res.json({ message: 'Şarkı başarıyla silindi' });
  } catch (error) {
    console.error('Şarkı silme hatası:', error);
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

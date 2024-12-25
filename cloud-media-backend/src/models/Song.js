const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Şarkı adı zorunludur'],
    trim: true
  },
  artist: {
    type: String,
    required: [true, 'Sanatçı adı zorunludur'],
    trim: true
  },
  genre: {
    type: String,
    required: [true, 'Tür zorunludur'],
    trim: true
  },
  album: {
    type: String,
    trim: true
  },
  year: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  language: {
    type: String,
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'Dosya yolu zorunludur']
  },
  artwork: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    required: [true, 'Şarkı süresi zorunludur']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Şarkı silindiğinde playlistlerden ve cihazlardan kaldır
songSchema.pre('remove', async function(next) {
  try {
    const Playlist = mongoose.model('Playlist');
    const Device = mongoose.model('Device');

    // Şarkıyı içeren playlistleri bul
    const playlists = await Playlist.find({ songs: this._id });
    
    // Her playlist için şarkıyı kaldır ve cihazlara bildir
    for (const playlist of playlists) {
      // Playlistten şarkıyı kaldır
      playlist.songs = playlist.songs.filter(songId => 
        songId.toString() !== this._id.toString()
      );
      
      // Playlist'i kaydet
      await playlist.save();

      // Bu playlist'i kullanan cihazları bul
      const devices = await Device.find({ activePlaylist: playlist._id });
      
      // Her cihaza güncellenmiş playlist'i gönder
      devices.forEach(device => {
        if (global.wss) {
          global.wss.sendToDevice(device.token, {
            type: 'playlist',
            data: {
              ...playlist.toObject(),
              baseUrl: process.env.BASE_URL || 'http://localhost:5000'
            }
          });
        }
      });
    }

    next();
  } catch (error) {
    console.error('Şarkı silme hatası:', error);
    next(error);
  }
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;
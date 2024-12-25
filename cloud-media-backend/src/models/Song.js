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

// Şarkı silindiğinde playlistlerden kaldır ve cihazlara bildir
songSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    console.log('Pre-deleteOne hook başladı. Silinen şarkı ID:', this._id);
    
    const Playlist = mongoose.model('Playlist');
    const Device = mongoose.model('Device');

    // Şarkıyı içeren playlistleri bul
    const playlists = await Playlist.find({ songs: this._id });
    console.log(`${playlists.length} adet playlist bulundu`);
    
    // Her playlist için şarkıyı kaldır ve cihazlara bildir
    for (const playlist of playlists) {
      console.log(`Playlist işleniyor: ${playlist._id}`);
      
      // Playlistten şarkıyı kaldır
      playlist.songs = playlist.songs.filter(songId => 
        songId.toString() !== this._id.toString()
      );
      
      // Playlist'i kaydet
      await playlist.save();
      console.log(`Şarkı playlistten kaldırıldı: ${playlist._id}`);

      // Bu playlist'i kullanan cihazları bul
      const devices = await Device.find({ activePlaylist: playlist._id });
      console.log(`${devices.length} adet cihaz bulundu`);
      
      // Her cihaza silinen şarkı bilgisini gönder
      devices.forEach(device => {
        if (global.wss) {
          console.log(`Cihaza bildirim gönderiliyor: ${device.token}`);
          global.wss.sendToDevice(device.token, {
            type: 'songRemoved',
            data: {
              songId: this._id,
              playlistId: playlist._id
            }
          });
        } else {
          console.error('WebSocket sunucusu bulunamadı (global.wss undefined)');
        }
      });
    }

    console.log('Pre-deleteOne hook başarıyla tamamlandı');
    next();
  } catch (error) {
    console.error('Şarkı silme hatası:', error);
    next(error);
  }
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;
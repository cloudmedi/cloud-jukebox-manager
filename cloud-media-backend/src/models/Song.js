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

songSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  console.log('=================== HOOK BAŞLANGICI ===================');
  console.log('pre-deleteOne hook tetiklendi');
  console.log('Silinecek şarkı ID:', this._id);
  console.log('Hook içindeki this objesi:', JSON.stringify(this, null, 2));

  try {
    console.log('Hook try bloğuna girdi');
    const Playlist = mongoose.model('Playlist');
    const Device = mongoose.model('Device');

    // Şarkıyı içeren playlistleri bul
    const playlists = await Playlist.find({ songs: this._id });
    console.log(`${playlists.length} playlist bulundu`);
    console.log('Bulunan playlistler:', JSON.stringify(playlists.map(p => p._id), null, 2));
    
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
      console.log(`${devices.length} cihaz bulundu playlist ${playlist._id} için`);
      console.log('Bulunan cihazlar:', JSON.stringify(devices.map(d => d.token), null, 2));
      
      // Her cihaza silinen şarkı bilgisini gönder
      devices.forEach(device => {
        if (global.wss) {
          console.log(`Cihaza bildirim gönderiliyor: ${device.token}`);
          console.log('WebSocket servisi mevcut:', !!global.wss);
          console.log('Gönderilecek mesaj:', {
            type: 'playlist',
            action: 'songRemoved',
            data: {
              songId: this._id,
              playlistId: playlist._id
            }
          });
          
          const sent = global.wss.sendToDevice(device.token, {
            type: 'playlist',
            action: 'songRemoved',
            data: {
              songId: this._id,
              playlistId: playlist._id
            }
          });
          console.log(`Bildirim gönderildi mi: ${sent ? 'Evet' : 'Hayır'}`);
        } else {
          console.error('WebSocket servisi bulunamadı (global.wss)');
        }
      });
    }

    console.log('Hook başarıyla tamamlandı');
    next();
  } catch (error) {
    console.error('Hook içinde hata oluştu:', error);
    next(error);
  }
  console.log('=================== HOOK SONU ===================');
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;
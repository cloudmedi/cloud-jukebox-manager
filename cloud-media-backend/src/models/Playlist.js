const mongoose = require('mongoose');
const DeleteMessage = require('../websocket/messages/DeleteMessage');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Playlist adı zorunludur'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  artwork: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: String,
    default: 'system'
  },
  isShuffled: {
    type: Boolean,
    default: false
  },
  totalDuration: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Playlistteki şarkı sayısını getiren helper method
playlistSchema.methods.getSongCount = function() {
  return this.songs.length;
};

// Toplam süreyi hesaplayan middleware
playlistSchema.pre('save', async function(next) {
  if (this.isModified('songs')) {
    try {
      // Populate songs to get their durations
      const populatedPlaylist = await this.populate('songs');
      
      // Calculate total duration
      this.totalDuration = populatedPlaylist.songs.reduce((total, song) => {
        return total + (song.duration || 0);
      }, 0);
      
      console.log(`Total duration calculated: ${this.totalDuration} seconds`);
    } catch (error) {
      console.error('Error calculating total duration:', error);
    }
  }
  next();
});

// Playlist silindiğinde cihazlardan referansını temizle
playlistSchema.pre('remove', async function(next) {
  console.log('=================== PLAYLIST SİLME BAŞLANGICI ===================');
  console.log('Silinecek playlist ID:', this._id);
  console.log('Playlist adı:', this.name);
  
  try {
    console.log('Cihazlardan playlist referansı temizleniyor...');
    const Device = mongoose.model('Device');
    
    // Etkilenen cihazları bul
    const affectedDevices = await Device.find({ activePlaylist: this._id });
    console.log('Etkilenen cihazlar:', affectedDevices.map(d => d.token));
    
    // Cihazları güncelle
    const updatedDevices = await Device.updateMany(
      { activePlaylist: this._id },
      { 
        $set: { 
          activePlaylist: null,
          playlistStatus: null 
        } 
      }
    );
    
    console.log('Etkilenen cihaz sayısı:', updatedDevices.modifiedCount);

    // WebSocket üzerinden cihazlara DeleteMessage kullanarak bildirim gönder
    if (global.wss) {
      // Silme başladı bildirimi
      global.wss.broadcastToAdmins(
        DeleteMessage.createDeleteStarted('playlist', this._id)
      );

      // Cihazlara bildirim gönder
      affectedDevices.forEach(device => {
        console.log('Cihaza bildirim gönderiliyor:', device.token);
        const sent = global.wss.sendToDevice(device.token, 
          DeleteMessage.createDeleteSuccess('playlist', this._id)
        );
        console.log('Bildirim gönderildi mi:', sent ? 'Evet' : 'Hayır');
      });

      // Başarılı silme bildirimi
      global.wss.broadcastToAdmins(
        DeleteMessage.createDeleteSuccess('playlist', this._id)
      );
    } else {
      console.warn('WebSocket servisi bulunamadı');
    }

    console.log('Playlist silme işlemi başarılı');
    next();
  } catch (error) {
    console.error('Playlist silme hatası:', error);
    
    // Hata durumunda bildirim gönder
    if (global.wss) {
      global.wss.broadcastToAdmins(
        DeleteMessage.createDeleteError('playlist', this._id, error)
      );
    }
    
    next(error);
  }
  console.log('=================== PLAYLIST SİLME SONU ===================');
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;
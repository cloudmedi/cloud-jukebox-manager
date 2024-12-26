const mongoose = require('mongoose');

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

// Playlist silindiğinde cihazlardan referansını temizle
playlistSchema.pre('remove', async function(next) {
  console.log('=================== PLAYLIST SİLME BAŞLANGICI ===================');
  console.log('Silinecek playlist ID:', this._id);
  console.log('Playlist adı:', this.name);
  
  try {
    console.log('Cihazlardan playlist referansı temizleniyor...');
    const Device = mongoose.model('Device');
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
    console.log('Playlist silme işlemi başarılı');
    next();
  } catch (error) {
    console.error('Playlist silme hatası:', error);
    next(error);
  }
  console.log('=================== PLAYLIST SİLME SONU ===================');
});

const Playlist = mongoose.model('Playlist', playlistSchema);

module.exports = Playlist;
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
    trim: true
  },
  filePath: {
    type: String,
    required: [true, 'Dosya yolu zorunludur']
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

// Şarkı silindiğinde playlistlerden referansını temizle
songSchema.pre('remove', async function(next) {
  const Playlist = mongoose.model('Playlist');
  await Playlist.updateMany(
    { songs: this._id },
    { $pull: { songs: this._id } }
  );
  next();
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;
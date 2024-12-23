const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  volume: {
    type: Number,
    default: 70
  },
  activePlaylist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Playlist'
  },
  playlistStatus: {
    type: String,
    enum: ['loading', 'loaded', 'error', null],
    default: null
  }
});

deviceSchema.methods.updateStatus = async function(isOnline) {
  this.isOnline = isOnline;
  return this.save();
};

deviceSchema.methods.setVolume = async function(volume) {
  this.volume = volume;
  return this.save();
};

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;
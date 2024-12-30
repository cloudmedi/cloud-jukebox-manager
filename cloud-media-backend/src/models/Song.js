const mongoose = require('mongoose');
const DeleteMessage = require('../websocket/messages/DeleteMessage');
const { createLogger } = require('../utils/logger');

const logger = createLogger('song-model');

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
  logger.info('=================== SONG DELETE HOOK START ===================');
  logger.info('Pre-deleteOne hook triggered');
  logger.info('Song to delete ID:', this._id);
  logger.info('Song details:', JSON.stringify(this, null, 2));

  try {
    logger.info('Starting hook execution');
    const Playlist = mongoose.model('Playlist');
    const Device = mongoose.model('Device');

    // Find playlists containing this song
    const playlists = await Playlist.find({ songs: this._id });
    logger.info(`Found ${playlists.length} playlists containing this song`);
    logger.info('Playlist IDs:', JSON.stringify(playlists.map(p => p._id), null, 2));
    
    // Process each playlist
    for (const playlist of playlists) {
      logger.info(`Processing playlist: ${playlist._id}`);
      
      // Remove song from playlist
      playlist.songs = playlist.songs.filter(songId => 
        songId.toString() !== this._id.toString()
      );
      
      // Save updated playlist
      await playlist.save();
      logger.info(`Song removed from playlist: ${playlist._id}`);

      // Find devices using this playlist
      const devices = await Device.find({ activePlaylist: playlist._id });
      logger.info(`Found ${devices.length} devices using playlist ${playlist._id}`);
      logger.info('Device tokens:', JSON.stringify(devices.map(d => d.token), null, 2));
      
      // Notify devices using the new DeleteMessage format
      devices.forEach(device => {
        if (global.wss) {
          logger.info(`Sending notification to device: ${device.token}`);
          logger.info('WebSocket service status:', !!global.wss);
          
          const message = DeleteMessage.createDeleteSuccess('song', this._id);
          
          logger.info('Sending message:', JSON.stringify(message, null, 2));
          
          const sent = global.wss.sendToDevice(device.token, message);
          logger.info(`Notification sent successfully: ${sent ? 'Yes' : 'No'}`);
        } else {
          logger.error('WebSocket service not found (global.wss)');
        }
      });
    }

    logger.info('Hook execution completed successfully');
    next();
  } catch (error) {
    logger.error('Hook execution error:', error);
    next(error);
  }
  logger.info('=================== SONG DELETE HOOK END ===================');
});

const Song = mongoose.model('Song', songSchema);

module.exports = Song;

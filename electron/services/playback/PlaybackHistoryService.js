const store = new Store();
const apiService = require('../apiService');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('PlaybackHistoryService');

class PlaybackHistoryService {
  async savePlaybackHistory(song, duration) {
    try {
      const deviceId = store.get('deviceId');
      if (!deviceId || !song?._id) {
        logger.error('Device ID or Song ID missing for playback history', {
          deviceId,
          songId: song?._id,
          songName: song?.name
        });
        return;
      }

      logger.info('Attempting to save playback history', {
        deviceId,
        songId: song._id,
        songName: song.name,
        duration,
        timestamp: new Date().toISOString()
      });

      const playbackData = {
        deviceId,
        songId: song._id,
        playDuration: Math.floor(duration || 0),
        completed: duration >= (song.duration * 0.9) // Şarkının en az %90'ı çalındıysa tamamlandı sayılır
      };

      const response = await apiService.savePlaybackHistory(playbackData);
      logger.info('Playback history saved successfully', {
        deviceId,
        songId: song._id,
        response
      });
      
      return response;
    } catch (error) {
      logger.error('Failed to save playback history', {
        error: error.message,
        stack: error.stack,
        deviceId: store.get('deviceId'),
        songId: song?._id,
        songName: song?.name
      });
      throw error;
    }
  }
}

module.exports = new PlaybackHistoryService();
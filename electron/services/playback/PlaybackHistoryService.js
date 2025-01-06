const store = new Store();
const apiService = require('../apiService');

class PlaybackHistoryService {
  async savePlaybackHistory(song, duration) {
    try {
      const deviceId = store.get('deviceId');
      if (!deviceId || !song?._id) {
        console.error('Device ID or Song ID missing for playback history', {
          deviceId,
          songId: song?._id
        });
        return;
      }

      console.log('Saving playback history:', {
        deviceId,
        songId: song._id,
        duration
      });

      const playbackData = {
        deviceId,
        songId: song._id,
        playDuration: Math.floor(duration || 0),
        completed: duration >= (song.duration * 0.9) // Şarkının en az %90'ı çalındıysa tamamlandı sayılır
      };

      const response = await apiService.savePlaybackHistory(playbackData);
      console.log('Playback history saved successfully:', response);
      return response;
    } catch (error) {
      console.error('Error saving playback history:', error);
      throw error;
    }
  }
}

module.exports = new PlaybackHistoryService();
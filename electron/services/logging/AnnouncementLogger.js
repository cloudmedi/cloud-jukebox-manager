class AnnouncementLogger {
  static logAudioState(audioElement) {
    console.log('Audio Element Durumu:', {
      src: audioElement.src,
      duration: audioElement.duration,
      currentTime: audioElement.currentTime,
      paused: audioElement.paused,
      volume: audioElement.volume
    });
  }

  static logPlaybackStart() {
    console.log('Kampanya Başladı:', new Date().toISOString());
  }

  static logPlaybackEnd() {
    console.log('Kampanya Bitti:', new Date().toISOString());
  }

  static logAnnouncementRequest(announcement) {
    console.log('Kampanya Çalma İsteği:', {
      id: announcement._id,
      path: announcement.localPath,
      time: new Date().toISOString()
    });
  }

  static logError(context, error) {
    console.error(`Hata (${context}):`, {
      message: error.message,
      stack: error.stack,
      time: new Date().toISOString()
    });
  }

  static logFileCheck(filePath) {
    const fs = require('fs');
    const exists = fs.existsSync(filePath);
    console.log('Dosya Kontrolü:', {
      path: filePath,
      exists: exists,
      time: new Date().toISOString()
    });
    return exists;
  }
}

module.exports = AnnouncementLogger;
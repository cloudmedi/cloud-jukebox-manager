const AnnouncementLogger = require('../logging/AnnouncementLogger');
const AnnouncementEventHandler = require('./handlers/AnnouncementEventHandler');

class AnnouncementAudioService {
  constructor() {
    this.playlistAudio = document.getElementById('audioPlayer');
    this.campaignAudio = document.getElementById('campaignPlayer');
    
    if (!this.campaignAudio || !this.playlistAudio) {
      console.error('Audio elementler bulunamadı!');
      return;
    }

    this.eventHandler = new AnnouncementEventHandler(
      this.playlistAudio,
      this.campaignAudio
    );
  }

  async playAnnouncement(announcement) {
    try {
      AnnouncementLogger.logAnnouncementRequest(announcement);

      if (!announcement.localPath) {
        throw new Error('Kampanya dosya yolu bulunamadı');
      }

      const success = await this.eventHandler.playAnnouncement(announcement.localPath);
      
      if (success) {
        AnnouncementLogger.logAudioState(this.campaignAudio);
        AnnouncementLogger.logPlaybackStart();
      }

      return success;
    } catch (error) {
      AnnouncementLogger.logError('Kampanya Çalma', error);
      console.error('Kampanya çalma hatası:', error);
      return false;
    }
  }
}

module.exports = new AnnouncementAudioService();
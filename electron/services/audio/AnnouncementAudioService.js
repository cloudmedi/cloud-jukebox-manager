const { ipcRenderer } = require('electron');
const AnnouncementLogger = require('../logging/AnnouncementLogger');

class AnnouncementAudioService {
  constructor() {
    this.audioElement = document.getElementById('campaignPlayer');
    if (!this.audioElement) {
      console.error('Campaign player element not found!');
      return;
    }
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.audioElement.addEventListener('loadeddata', () => {
      AnnouncementLogger.logAudioState(this.audioElement);
    });

    this.audioElement.addEventListener('play', () => {
      AnnouncementLogger.logPlaybackStart();
    });

    this.audioElement.addEventListener('ended', () => {
      AnnouncementLogger.logPlaybackEnd();
      this.cleanup();
    });

    this.audioElement.addEventListener('error', (error) => {
      AnnouncementLogger.logError('Audio Playback', error);
      this.cleanup();
    });
  }

  cleanup() {
    console.log('Cleaning up announcement audio');
    this.audioElement.src = '';
    ipcRenderer.send('announcement-ended');
  }

  async playAnnouncement(announcement) {
    try {
      AnnouncementLogger.logAnnouncementRequest(announcement);

      if (!announcement.localPath) {
        throw new Error('Anons dosya yolu bulunamadı');
      }

      if (!AnnouncementLogger.logFileCheck(announcement.localPath)) {
        throw new Error('Anons dosyası bulunamadı');
      }

      this.audioElement.volume = 1.0;
      this.audioElement.src = announcement.localPath;
      await this.audioElement.play();

      return true;
    } catch (error) {
      AnnouncementLogger.logError('Anons Çalma', error);
      this.cleanup();
      return false;
    }
  }
}

module.exports = new AnnouncementAudioService();
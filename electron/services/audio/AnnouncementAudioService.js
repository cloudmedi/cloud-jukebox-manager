const { ipcRenderer } = require('electron');
const AnnouncementLogger = require('../logging/AnnouncementLogger');

class AnnouncementAudioService {
  constructor() {
    this.audioElement = new Audio();
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.audioElement.addEventListener('loadeddata', () => {
      AnnouncementLogger.logAudioState(this.audioElement);
    });

    this.audioElement.addEventListener('play', () => {
      AnnouncementLogger.logPlaybackStart();
    });

    this.audioElement.addEventListener('timeupdate', () => {
      AnnouncementLogger.logPlaybackProgress(this.audioElement.currentTime);
    });

    this.audioElement.addEventListener('ended', () => {
      AnnouncementLogger.logPlaybackEnd();
      ipcRenderer.send('announcement-ended');
    });

    this.audioElement.addEventListener('error', (error) => {
      AnnouncementLogger.logError('Audio Playback', error);
    });
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

      // Mevcut ses durumunu kaydet
      const currentVolume = this.audioElement.volume;
      AnnouncementLogger.logVolumeChange(currentVolume, 1.0);

      // Ses ayarını yap
      this.audioElement.volume = 1.0;

      // Dosyayı yükle ve çal
      this.audioElement.src = announcement.localPath;
      await this.audioElement.play();

      return true;
    } catch (error) {
      AnnouncementLogger.logError('Anons Çalma', error);
      return false;
    }
  }
}

module.exports = new AnnouncementAudioService();
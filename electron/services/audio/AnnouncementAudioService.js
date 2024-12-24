const { ipcRenderer } = require('electron');
const AnnouncementLogger = require('../logging/AnnouncementLogger');

class AnnouncementAudioService {
  constructor() {
    this.audioElement = document.getElementById('campaignPlayer');
    if (!this.audioElement) {
      console.error('Kampanya player elementi bulunamadı!');
      return;
    }
    this.setupEventListeners();
    this.lastAnnouncementTime = 0;
    this.minAnnouncementInterval = 5000; // 5 saniye
  }

  setupEventListeners() {
    this.audioElement.addEventListener('loadeddata', () => {
      console.log('Kampanya ses dosyası yüklendi');
      AnnouncementLogger.logAudioState(this.audioElement);
    });

    this.audioElement.addEventListener('play', () => {
      console.log('Kampanya çalmaya başladı');
      AnnouncementLogger.logPlaybackStart();
    });

    this.audioElement.addEventListener('ended', () => {
      console.log('Kampanya bitti');
      AnnouncementLogger.logPlaybackEnd();
      this.cleanup();
    });

    this.audioElement.addEventListener('error', (error) => {
      console.error('Kampanya çalma hatası:', error);
      AnnouncementLogger.logError('Kampanya Çalma', error);
      this.cleanup();
    });
  }

  cleanup() {
    console.log('Kampanya temizleniyor');
    this.audioElement.src = '';
    this.lastAnnouncementTime = Date.now();
    ipcRenderer.send('announcement-ended');
  }

  async playAnnouncement(announcement) {
    try {
      // Minimum süre kontrolü
      const now = Date.now();
      if (now - this.lastAnnouncementTime < this.minAnnouncementInterval) {
        console.log('Kampanyalar arası minimum süre bekleniyor');
        return false;
      }

      AnnouncementLogger.logAnnouncementRequest(announcement);

      if (!announcement.localPath) {
        throw new Error('Kampanya dosya yolu bulunamadı');
      }

      console.log('Kampanya başlatılıyor:', announcement.localPath);
      this.audioElement.src = announcement.localPath;
      await this.audioElement.play();

      return true;
    } catch (error) {
      AnnouncementLogger.logError('Kampanya Çalma', error);
      console.error('Kampanya çalma hatası:', error);
      this.cleanup();
      return false;
    }
  }
}

module.exports = new AnnouncementAudioService();
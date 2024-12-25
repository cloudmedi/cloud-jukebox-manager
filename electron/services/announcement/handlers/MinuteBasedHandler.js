const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class MinuteBasedHandler {
  constructor() {
    this.store = new Store();
    this.lastPlayTimes = new Map();
    this.isProcessingAnnouncement = false;
    this.wasPlaylistPlaying = false;
    this.lastAnnouncementTime = 0;
  }

  check() {
    const announcements = this.store.get('announcements', []);
    const now = new Date();

    // Minimum bekleme süresi kontrolü (5 saniye)
    if (Date.now() - this.lastAnnouncementTime < 5000) {
      console.log('Son anonstan bu yana 5 saniye geçmedi, kontrol atlanıyor');
      return;
    }

    // Eğer başka bir anons çalıyorsa bekle
    if (this.isProcessingAnnouncement) {
      console.log('Başka bir anons çalıyor, kontrol atlanıyor');
      return;
    }

    announcements
      .filter(announcement => 
        announcement.scheduleType === 'minutes' &&
        new Date(announcement.startDate) <= now &&
        new Date(announcement.endDate) >= now
      )
      .forEach(announcement => {
        const lastPlayTime = this.lastPlayTimes.get(announcement._id) || 0;
        const minutesPassed = (Date.now() - lastPlayTime) / (1000 * 60);

        console.log(`Dakika kontrolü: ${announcement._id}`);
        console.log(`Geçen dakika: ${minutesPassed}`);
        console.log(`Dakika aralığı: ${announcement.minuteInterval}`);

        if (minutesPassed >= announcement.minuteInterval) {
          console.log(`Dakika bazlı anons başlatılıyor: ${announcement._id}`);
          this.isProcessingAnnouncement = true;
          this.playAnnouncement(announcement);
          this.lastPlayTimes.set(announcement._id, Date.now());
          this.lastAnnouncementTime = Date.now();
        }
      });
  }

  async playAnnouncement(announcement) {
    console.log('Dakika bazlı anons çalma başlatılıyor');
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      console.error('Ana pencere bulunamadı');
      this.isProcessingAnnouncement = false;
      return;
    }

    try {
      // Playlist durumunu kontrol et
      const isPaused = await mainWindow.webContents.executeJavaScript('document.getElementById("audioPlayer").paused');
      this.wasPlaylistPlaying = !isPaused;
      console.log('Playlist durumu kaydedildi:', this.wasPlaylistPlaying);

      // Anons bittiğinde çalışacak event listener
      require('electron').ipcMain.once('announcement-ended', () => {
        console.log('Dakika bazlı anons bitti');
        this.isProcessingAnnouncement = false;
        
        if (this.wasPlaylistPlaying) {
          console.log('Playlist devam ettiriliyor');
          setTimeout(() => {
            mainWindow.webContents.send('resume-playback');
          }, 500);
        }
        
        this.wasPlaylistPlaying = false;
      });

      // Anons çalma isteği gönder
      mainWindow.webContents.send('play-announcement', announcement);
      
    } catch (error) {
      console.error('Anons çalma hatası:', error);
      this.isProcessingAnnouncement = false;
    }
  }
}

module.exports = new MinuteBasedHandler();
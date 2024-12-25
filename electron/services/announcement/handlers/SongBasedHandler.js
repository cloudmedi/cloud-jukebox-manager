const { BrowserWindow } = require('electron');
const Store = require('electron-store');
const AnnouncementManager = require('../AnnouncementManager').default;

class SongBasedHandler {
  constructor() {
    this.store = new Store();
    this.songCounter = 0;
    this.lastAnnouncementTime = 0;
  }

  async onSongEnd() {
    console.log('\n=== ŞARKI BAZLI ANONS KONTROLÜ ===');
    
    try {
      // Minimum süre kontrolü
      const now = Date.now();
      if (now - this.lastAnnouncementTime < 5000) {
        console.log('Son anonstan bu yana 5 saniye geçmedi');
        return;
      }

      this.songCounter++;
      console.log(`Şarkı sayacı: ${this.songCounter}`);
      
      const announcements = this.store.get('announcements', []);
      const currentTime = new Date();

      for (const announcement of announcements) {
        if (this.shouldPlayAnnouncement(announcement, currentTime)) {
          await this.processAnnouncement(announcement);
        }
      }
    } catch (error) {
      console.error('Şarkı bazlı anons kontrolü hatası:', error);
    }
  }

  shouldPlayAnnouncement(announcement, currentTime) {
    return (
      announcement.scheduleType === 'songs' &&
      new Date(announcement.startDate) <= currentTime &&
      new Date(announcement.endDate) >= currentTime &&
      this.songCounter % announcement.songInterval === 0
    );
  }

  async processAnnouncement(announcement) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      console.error('❌ Ana pencere bulunamadı!');
      return;
    }

    try {
      // Anons başlatma izni al
      const canStart = await AnnouncementManager.startAnnouncement(
        announcement._id,
        'song'
      );

      if (!canStart) {
        console.log('Başka bir anons çalıyor, şarkı bazlı anons atlanıyor');
        return;
      }

      // Playlist durumunu kontrol et
      const isPaused = await mainWindow.webContents.executeJavaScript(
        'document.getElementById("audioPlayer").paused'
      );
      
      AnnouncementManager.savePlaylistState(!isPaused);

      // Anons bitince çalışacak event listener'ı ayarla
      require('electron').ipcMain.once('announcement-ended', () => {
        console.log('Şarkı bazlı anons bitti, temizleme başladı');
        const state = AnnouncementManager.endAnnouncement();
        
        if (state.wasPlaying && state.handler === 'song') {
          console.log('Playlist şarkı bazlı anonstan sonra devam ediyor');
          mainWindow.webContents.send('resume-playback');
        }
      });

      console.log('Şarkı bazlı anons çalma isteği gönderiliyor...');
      mainWindow.webContents.send('play-announcement', announcement);
      this.lastAnnouncementTime = Date.now();

    } catch (error) {
      console.error('Şarkı bazlı anons işleme hatası:', error);
      AnnouncementManager.endAnnouncement();
    }
  }
}

module.exports = new SongBasedHandler();
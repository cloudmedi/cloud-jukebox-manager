const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class SongBasedHandler {
  constructor() {
    this.store = new Store();
    this.songCounter = 0;
    this.isProcessingAnnouncement = false;
    this.lastAnnouncementTime = 0;
    this.lastSongEndTime = 0;
    this.announcementEndListener = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Önce varsa eski listener'ı temizle
    if (this.announcementEndListener) {
      require('electron').ipcMain.removeListener('announcement-ended', this.announcementEndListener);
    }

    // Yeni listener'ı oluştur ve sakla
    this.announcementEndListener = () => {
      if (this.isProcessingAnnouncement) {
        console.log('Anons bitti sinyali alındı, flag sıfırlanıyor');
        this.isProcessingAnnouncement = false;
        this.lastAnnouncementTime = Date.now();
      }
    };

    // Yeni listener'ı ekle
    require('electron').ipcMain.on('announcement-ended', this.announcementEndListener);
  }

  onSongEnd() {
    console.log('\n=== ŞARKI BAZLI ANONS KONTROLÜ ===');
    console.log('İşlem durumu:', this.isProcessingAnnouncement);
    
    if (this.isProcessingAnnouncement) {
      console.log('Anons işleniyor, sayaç artırılmıyor');
      return;
    }

    const now = Date.now();
    
    if (now - this.lastAnnouncementTime < 5000) {
      console.log('Son anonstan bu yana 5 saniye geçmedi, sayaç artırılmıyor');
      return;
    }

    if (now - this.lastSongEndTime < 2000) {
      console.log('Son şarkı bitişinden bu yana 2 saniye geçmedi, sayaç artırılmıyor');
      return;
    }

    this.songCounter++;
    this.lastSongEndTime = now;
    console.log(`Şarkı sayacı artırıldı: ${this.songCounter}`);
    
    const announcements = this.store.get('announcements', []);
    const currentTime = new Date();

    announcements
      .filter(announcement => 
        announcement.scheduleType === 'songs' &&
        new Date(announcement.startDate) <= currentTime &&
        new Date(announcement.endDate) >= currentTime
      )
      .forEach(announcement => {
        console.log(`\nAnons Kontrolü (${announcement._id}):`);
        console.log(`- Başlangıç: ${announcement.startDate}`);
        console.log(`- Bitiş: ${announcement.endDate}`);
        console.log(`- Şarkı aralığı: ${announcement.songInterval}`);
        console.log(`- Mevcut sayaç: ${this.songCounter}`);
        
        if (this.songCounter % announcement.songInterval === 0) {
          console.log('✓ Anons çalma koşulu sağlandı');
          this.isProcessingAnnouncement = true;
          this.playAnnouncement(announcement);
        } else {
          const remainingSongs = announcement.songInterval - (this.songCounter % announcement.songInterval);
          console.log(`× Anons çalma koşulu sağlanmadı. ${remainingSongs} şarkı sonra çalınacak`);
        }
      });
  }

  playAnnouncement(announcement) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      console.error('❌ Ana pencere bulunamadı!');
      this.isProcessingAnnouncement = false;
      return;
    }

    console.log('Anons çalma isteği gönderiliyor...');
    mainWindow.webContents.send('play-announcement', announcement);
  }

  cleanup() {
    if (this.announcementEndListener) {
      require('electron').ipcMain.removeListener('announcement-ended', this.announcementEndListener);
      this.announcementEndListener = null;
    }
  }
}

module.exports = new SongBasedHandler();
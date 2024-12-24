const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class SongBasedHandler {
  constructor() {
    this.store = new Store();
    this.songCounter = 0;
    this.isProcessingAnnouncement = false;
  }

  onSongEnd() {
    if (this.isProcessingAnnouncement) {
      console.log('Skipping announcement check during announcement playback');
      return;
    }

    this.songCounter++;
    console.log('\n=== ŞARKI BAZLI ANONS KONTROLÜ ===');
    console.log(`Şarkı sayacı: ${this.songCounter}`);
    
    const announcements = this.store.get('announcements', []);
    const now = new Date();

    announcements
      .filter(announcement => 
        announcement.scheduleType === 'songs' &&
        new Date(announcement.startDate) <= now &&
        new Date(announcement.endDate) >= now
      )
      .forEach(announcement => {
        console.log(`\nAnons Kontrolü (${announcement._id}):`);
        console.log(`- Başlangıç: ${announcement.startDate}`);
        console.log(`- Bitiş: ${announcement.endDate}`);
        console.log(`- Şarkı aralığı: ${announcement.songInterval}`);
        console.log(`- Mevcut sayaç: ${this.songCounter}`);
        console.log(`- Mod hesabı: ${this.songCounter % announcement.songInterval}`);
        
        if (this.songCounter % announcement.songInterval === 0) {
          console.log('✓ Anons çalma koşulu sağlandı, çalınıyor...');
          this.isProcessingAnnouncement = true;
          this.playAnnouncement(announcement);
        } else {
          console.log(`× Anons çalma koşulu sağlanmadı. ${announcement.songInterval - (this.songCounter % announcement.songInterval)} şarkı sonra çalınacak`);
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
    
    // Anons bittiğinde isProcessingAnnouncement'ı false yap
    mainWindow.webContents.once('ipc-message', (event, channel) => {
      if (channel === 'announcement-ended') {
        console.log('Anons bitti, işlem durumu sıfırlanıyor');
        this.isProcessingAnnouncement = false;
      }
    });
  }
}

module.exports = new SongBasedHandler();
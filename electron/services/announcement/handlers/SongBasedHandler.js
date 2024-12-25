const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class SongBasedHandler {
  constructor() {
    this.store = new Store();
    this.songCounter = 0;
    this.isProcessingAnnouncement = false;
    this.lastAnnouncementTime = 0;
  }

  onSongEnd() {
    if (this.isProcessingAnnouncement) {
      console.log('Skipping announcement check during announcement playback');
      return;
    }

    const now = Date.now();
    // En az 5 saniye geçmeden yeni anons kontrolü yapma
    if (now - this.lastAnnouncementTime < 5000) {
      console.log('Skipping announcement check, too soon after last announcement');
      return;
    }

    this.songCounter++;
    console.log('\n=== ŞARKI BAZLI ANONS KONTROLÜ ===');
    console.log(`Şarkı sayacı: ${this.songCounter}`);
    
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
          console.log('✓ Anons çalma koşulu sağlandı, çalınıyor...');
          this.isProcessingAnnouncement = true;
          this.lastAnnouncementTime = now;
          this.playAnnouncement(announcement);
          
          // Sayacı sıfırla
          this.songCounter = 0;
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
    
    // Anons bittiğinde state'i temizle
    mainWindow.webContents.once('ipc-message', (event, channel) => {
      if (channel === 'announcement-ended') {
        console.log('Anons bitti, işlem durumu sıfırlanıyor');
        this.isProcessingAnnouncement = false;
      }
    });
  }
}

module.exports = new SongBasedHandler();
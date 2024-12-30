const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class SongBasedHandler {
  constructor() {
    this.store = new Store();
    this.songCounter = 0;
    this.isProcessingAnnouncement = false;
    this.lastAnnouncementTime = 0;
    this.lastSongEndTime = 0;
    this.setupEventListeners();
  }

  setupEventListeners() {
    require('electron').ipcMain.on('announcement-ended', () => {
      console.log('Anons bitti sinyali alındı, flag sıfırlanıyor');
      this.isProcessingAnnouncement = false;
      // Anons bittiğinde sayacı artırmıyoruz ve son anons zamanını kaydediyoruz
      this.lastAnnouncementTime = Date.now();
    });
  }

  onSongEnd() {
    console.log('\n=== ŞARKI BAZLI ANONS KONTROLÜ ===');
    console.log('İşlem durumu:', this.isProcessingAnnouncement);
    
    // Eğer anons işleniyorsa sayacı artırma
    if (this.isProcessingAnnouncement) {
      console.log('Anons işleniyor, sayaç artırılmıyor');
      return;
    }

    // Minimum süre kontrolü
    const now = Date.now();
    
    // Son anonstan bu yana geçen süreyi kontrol et
    if (now - this.lastAnnouncementTime < 5000) {
      console.log('Son anonstan bu yana 5 saniye geçmedi, sayaç artırılmıyor');
      return;
    }

    // Son şarkı bitişinden bu yana geçen süreyi kontrol et
    if (now - this.lastSongEndTime < 2000) {
      console.log('Son şarkı bitişinden bu yana 2 saniye geçmedi, sayaç artırılmıyor');
      return;
    }

    // Sadece normal şarkı bittiğinde sayacı artır
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
}

module.exports = new SongBasedHandler();
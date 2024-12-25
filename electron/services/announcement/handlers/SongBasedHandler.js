const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class SongBasedHandler {
  constructor() {
    this.store = new Store();
    this.songCounter = 0;
    this.isProcessingAnnouncement = false;
    this.lastAnnouncementTime = 0;
    this.isPlaylistPaused = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    require('electron').ipcMain.on('announcement-ended', () => {
      console.log('Anons bitti sinyali alındı, flag sıfırlanıyor');
      this.isProcessingAnnouncement = false;
    });

    // Playlist durumu için yeni event listener
    require('electron').ipcMain.on('playback-status-changed', (event, isPlaying) => {
      this.isPlaylistPaused = !isPlaying;
    });
  }

  onSongEnd() {
    console.log('\n=== ŞARKI BAZLI ANONS KONTROLÜ ===');
    console.log('İşlem durumu:', this.isProcessingAnnouncement);
    console.log('Playlist durumu:', this.isPlaylistPaused ? 'duraklatılmış' : 'çalıyor');
    
    // Eğer bu çağrı kampanya için yapılan bir duraklatmadan geliyorsa, sayacı arttırma
    if (this.isProcessingAnnouncement || this.isPlaylistPaused) {
      console.log('Kampanya/duraklatma nedeniyle sayaç arttırılmıyor');
      return;
    }

    // Normal şarkı bitişi - sayacı arttır
    this.songCounter++;
    console.log(`Şarkı sayacı arttırıldı: ${this.songCounter}`);
    
    // Eğer anons işleniyorsa bekle
    if (this.isProcessingAnnouncement) {
      console.log('Anons işleniyor, kontrol atlanıyor');
      return;
    }

    // Minimum süre kontrolü
    const now = Date.now();
    if (now - this.lastAnnouncementTime < 5000) {
      console.log('Son anonstan bu yana 5 saniye geçmedi');
      return;
    }

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
          this.lastAnnouncementTime = now;
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
  }
}

module.exports = new SongBasedHandler();
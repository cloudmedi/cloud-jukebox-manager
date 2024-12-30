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
      console.log('Anons bitti, state temizleniyor');
      this.isProcessingAnnouncement = false;
      this.lastAnnouncementTime = Date.now();
    });
  }

  onSongEnd() {
    console.log('\n=== ŞARKI BAZLI ANONS KONTROLÜ ===');
    
    // Eğer anons işleniyorsa veya son anonstan bu yana yeterli süre geçmediyse işlem yapma
    if (this.isProcessingAnnouncement || 
        Date.now() - this.lastAnnouncementTime < 5000 ||
        Date.now() - this.lastSongEndTime < 2000) {
      console.log('Anons işleniyor veya minimum süre geçmedi, sayaç artırılmıyor');
      return;
    }

    // Sayacı artır ve son şarkı bitişini kaydet
    this.songCounter++;
    this.lastSongEndTime = Date.now();
    console.log(`Şarkı sayacı: ${this.songCounter}`);
    
    const announcements = this.store.get('announcements', []);
    const currentTime = new Date();

    // Aktif anonsları filtrele
    const activeAnnouncements = announcements.filter(announcement => 
      announcement.scheduleType === 'songs' &&
      new Date(announcement.startDate) <= currentTime &&
      new Date(announcement.endDate) >= currentTime
    );

    console.log(`Aktif anons sayısı: ${activeAnnouncements.length}`);

    // Her aktif anons için kontrol yap
    activeAnnouncements.forEach(announcement => {
      console.log(`\nAnons Kontrolü (${announcement._id}):`);
      console.log(`- Şarkı aralığı: ${announcement.songInterval}`);
      console.log(`- Mevcut sayaç: ${this.songCounter}`);
      
      if (this.songCounter % announcement.songInterval === 0) {
        console.log('✓ Anons çalma koşulu sağlandı');
        this.isProcessingAnnouncement = true;
        this.playAnnouncement(announcement);
      } else {
        const remainingSongs = announcement.songInterval - (this.songCounter % announcement.songInterval);
        console.log(`× ${remainingSongs} şarkı sonra çalınacak`);
      }
    });
  }

  playAnnouncement(announcement) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      console.error('Ana pencere bulunamadı');
      this.isProcessingAnnouncement = false;
      return;
    }

    console.log('Anons çalma isteği gönderiliyor:', announcement._id);
    mainWindow.webContents.send('play-announcement', announcement);
  }
}

module.exports = new SongBasedHandler();
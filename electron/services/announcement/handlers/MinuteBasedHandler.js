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
    console.log('\n=== DAKİKA BAZLI ANONS KONTROLÜ ===');
    console.log('İşlem durumu:', this.isProcessingAnnouncement);
    
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
        announcement.scheduleType === 'minutes' &&
        new Date(announcement.startDate) <= currentTime &&
        new Date(announcement.endDate) >= currentTime
      )
      .forEach(announcement => {
        console.log(`\nAnons Kontrolü (${announcement._id}):`);
        console.log(`- Başlangıç: ${announcement.startDate}`);
        console.log(`- Bitiş: ${announcement.endDate}`);
        console.log(`- Dakika aralığı: ${announcement.minuteInterval}`);
        
        const lastPlayTime = this.lastPlayTimes.get(announcement._id) || 0;
        const minutesPassed = (now - lastPlayTime) / (1000 * 60);

        console.log(`- Geçen dakika: ${minutesPassed.toFixed(2)}`);
        console.log(`- Hedef dakika: ${announcement.minuteInterval}`);
        
        if (minutesPassed >= announcement.minuteInterval) {
          console.log('✓ Anons çalma koşulu sağlandı');
          this.isProcessingAnnouncement = true;
          this.lastAnnouncementTime = now;
          this.playAnnouncement(announcement);
          this.lastPlayTimes.set(announcement._id, now);
        } else {
          console.log(`× Anons çalma koşulu sağlanmadı. ${(announcement.minuteInterval - minutesPassed).toFixed(2)} dakika sonra çalınacak`);
        }
      });
  }

  async playAnnouncement(announcement) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      console.error('❌ Ana pencere bulunamadı!');
      this.isProcessingAnnouncement = false;
      return;
    }

    try {
      console.log('Playlist durumu kontrol ediliyor...');
      const isPaused = await mainWindow.webContents.executeJavaScript('document.getElementById("audioPlayer").paused');
      this.wasPlaylistPlaying = !isPaused;
      console.log('Playlist durumu:', this.wasPlaylistPlaying ? 'çalıyor' : 'duraklatılmış');

      // Anons bittiğinde flag'i sıfırla ve playlist'i devam ettir
      require('electron').ipcMain.once('announcement-ended', () => {
        console.log('Dakika bazlı anons bitti, temizleme yapılıyor');
        this.isProcessingAnnouncement = false;
        
        if (this.wasPlaylistPlaying) {
          console.log('Playlist kaldığı yerden devam ediyor');
          setTimeout(() => {
            mainWindow.webContents.send('resume-playback');
          }, 500);
        }
        
        this.wasPlaylistPlaying = false;
      });

      console.log('Anons çalma isteği gönderiliyor...');
      mainWindow.webContents.send('play-announcement', announcement);
      
    } catch (error) {
      console.error('Anons çalma hatası:', error);
      this.isProcessingAnnouncement = false;
      this.wasPlaylistPlaying = false;
    }
  }
}

module.exports = new MinuteBasedHandler();
const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class AnnouncementPlayer {
  constructor() {
    this.store = new Store();
    this.currentAnnouncement = null;
    this.wasPlaying = false;
  }

  async playAnnouncement(announcement) {
    try {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) return;

      // Mevcut playlist durumunu kaydet
      this.wasPlaying = this.store.get('playback.isPlaying', false);
      
      // Playlist'i duraklat
      if (this.wasPlaying) {
        mainWindow.webContents.send('pause-playlist');
      }

      // Anonsu oynat
      mainWindow.webContents.send('play-announcement', announcement);
      
      // Anons bitiminde playlist'e geri dön
      setTimeout(() => {
        this.stopAnnouncement();
      }, announcement.duration * 1000);
    } catch (error) {
      console.error('Error playing announcement:', error);
    }
  }

  stopAnnouncement() {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.webContents.send('stop-announcement');
    
    // Eğer playlist çalıyorduysa devam et
    if (this.wasPlaying) {
      mainWindow.webContents.send('resume-playlist');
    }
  }
}

module.exports = new AnnouncementPlayer();
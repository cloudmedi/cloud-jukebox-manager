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
      console.log('Playing announcement:', announcement);
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        throw new Error('Main window not found');
      }

      // Mevcut playlist durumunu kaydet
      this.wasPlaying = this.store.get('playback.isPlaying', false);
      console.log('Current playback state:', this.wasPlaying);
      
      // Playlist'i duraklat
      if (this.wasPlaying) {
        console.log('Pausing playlist for announcement');
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
      throw error;
    }
  }

  stopAnnouncement() {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      console.error('No main window found');
      return;
    }

    console.log('Stopping announcement');
    mainWindow.webContents.send('stop-announcement');
    
    // Eğer playlist çalıyorduysa devam et
    if (this.wasPlaying) {
      console.log('Resuming playlist');
      mainWindow.webContents.send('resume-playlist');
    }
  }
}

module.exports = new AnnouncementPlayer();
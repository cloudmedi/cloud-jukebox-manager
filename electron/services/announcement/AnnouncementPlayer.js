const { BrowserWindow } = require('electron');
const Store = require('electron-store');
const store = new Store();

class AnnouncementPlayer {
  constructor() {
    this.currentAnnouncement = null;
  }

  getCurrentAnnouncement() {
    return this.currentAnnouncement;
  }

  async playAnnouncement(announcement) {
    try {
      console.log('Playing announcement:', announcement);
      
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (!mainWindow) {
        throw new Error('Main window not found');
      }

      // Mevcut playlist'i duraklat
      mainWindow.webContents.send('pause-playback');
      
      // Anonsu çal
      mainWindow.webContents.send('play-announcement', announcement);
      
      this.currentAnnouncement = announcement;
      
      // Anons süresini bekle ve sonra playlist'i devam ettir
      setTimeout(() => {
        this.onAnnouncementEnd();
      }, announcement.duration * 1000);
      
    } catch (error) {
      console.error('Error playing announcement:', error);
      throw error;
    }
  }

  async stopAnnouncement() {
    console.log('Stopping announcement');
    
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.webContents.send('stop-announcement');
    this.onAnnouncementEnd();
  }

  onAnnouncementEnd() {
    console.log('Announcement ended');
    
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    // Playlist'i devam ettir
    mainWindow.webContents.send('resume-playback');
    this.currentAnnouncement = null;
  }
}

module.exports = new AnnouncementPlayer();
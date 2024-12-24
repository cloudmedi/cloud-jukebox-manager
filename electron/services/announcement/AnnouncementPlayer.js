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

      // Save current playlist state
      this.wasPlaying = this.store.get('playback.isPlaying', false);
      console.log('Current playback state:', this.wasPlaying);
      
      // Pause playlist if it's playing
      if (this.wasPlaying) {
        console.log('Pausing playlist for announcement');
        mainWindow.webContents.send('pause-playlist');
      }

      // Play announcement
      mainWindow.webContents.send('play-announcement', announcement);
      
      // Resume playlist after announcement ends
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
    
    // Resume playlist if it was playing before
    if (this.wasPlaying) {
      console.log('Resuming playlist');
      mainWindow.webContents.send('resume-playlist');
    }
  }
}

module.exports = new AnnouncementPlayer();
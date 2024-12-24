const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class AnnouncementPlayer {
  constructor() {
    this.store = new Store();
    this.currentAnnouncement = null;
    this.wasPlaying = false;
    this.playbackTimeout = null;
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
      this.currentAnnouncement = announcement;
      mainWindow.webContents.send('play-announcement', announcement);
      
      // Set timeout to stop announcement after duration
      if (this.playbackTimeout) {
        clearTimeout(this.playbackTimeout);
      }
      
      this.playbackTimeout = setTimeout(() => {
        this.stopAnnouncement();
      }, announcement.duration * 1000);

    } catch (error) {
      console.error('Error playing announcement:', error);
      this.stopAnnouncement(); // Attempt to recover
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
    
    // Clear timeout
    if (this.playbackTimeout) {
      clearTimeout(this.playbackTimeout);
      this.playbackTimeout = null;
    }
    
    // Resume playlist if it was playing before
    if (this.wasPlaying) {
      console.log('Resuming playlist');
      mainWindow.webContents.send('resume-playlist');
    }

    this.currentAnnouncement = null;
  }

  getCurrentAnnouncement() {
    return this.currentAnnouncement;
  }
}

module.exports = new AnnouncementPlayer();
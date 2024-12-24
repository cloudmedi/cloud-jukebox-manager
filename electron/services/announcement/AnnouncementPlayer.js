const { BrowserWindow } = require('electron');

class AnnouncementPlayer {
  constructor() {
    this.currentAnnouncement = null;
  }

  playAnnouncement(announcement) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    this.currentAnnouncement = announcement;
    
    mainWindow.webContents.send('play-announcement', announcement);
  }

  stopAnnouncement() {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.webContents.send('stop-announcement');
    this.currentAnnouncement = null;
  }
}

module.exports = new AnnouncementPlayer();
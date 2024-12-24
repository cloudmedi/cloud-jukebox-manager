const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class SongBasedHandler {
  constructor() {
    this.store = new Store();
    this.songCounter = 0;
  }

  onSongEnd() {
    this.songCounter++;
    console.log(`Song ended, counter: ${this.songCounter}`);
    
    const announcements = this.store.get('announcements', []);
    const now = new Date();

    announcements
      .filter(announcement => 
        announcement.scheduleType === 'songs' &&
        new Date(announcement.startDate) <= now &&
        new Date(announcement.endDate) >= now
      )
      .forEach(announcement => {
        console.log(`Checking song-based announcement ${announcement._id}`);
        console.log(`Song counter: ${this.songCounter}, Interval: ${announcement.songInterval}`);
        
        if (this.songCounter % announcement.songInterval === 0) {
          console.log(`Playing song-based announcement ${announcement._id}`);
          this.playAnnouncement(announcement);
        } else {
          console.log(`Skipping announcement ${announcement._id}, waiting for ${announcement.songInterval - (this.songCounter % announcement.songInterval)} more songs`);
        }
      });
  }

  playAnnouncement(announcement) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.webContents.send('play-announcement', announcement);
  }
}

module.exports = new SongBasedHandler();
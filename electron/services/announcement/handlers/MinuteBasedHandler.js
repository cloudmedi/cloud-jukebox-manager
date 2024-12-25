const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class MinuteBasedHandler {
  constructor() {
    this.store = new Store();
    this.lastPlayTimes = new Map();
    this.isProcessingAnnouncement = false;
  }

  check() {
    const announcements = this.store.get('announcements', []);
    const now = new Date();

    announcements
      .filter(announcement => 
        announcement.scheduleType === 'minutes' &&
        new Date(announcement.startDate) <= now &&
        new Date(announcement.endDate) >= now
      )
      .forEach(announcement => {
        const lastPlayTime = this.lastPlayTimes.get(announcement._id) || 0;
        const minutesPassed = (Date.now() - lastPlayTime) / (1000 * 60);

        console.log(`Minutes passed for ${announcement._id}: ${minutesPassed}`);
        console.log(`Minute interval: ${announcement.minuteInterval}`);

        if (minutesPassed >= announcement.minuteInterval && !this.isProcessingAnnouncement) {
          console.log(`Playing minute-based announcement ${announcement._id}`);
          this.isProcessingAnnouncement = true;
          this.playAnnouncement(announcement);
          this.lastPlayTimes.set(announcement._id, Date.now());
        } else {
          console.log(`Skipping announcement ${announcement._id}, waiting for ${announcement.minuteInterval - minutesPassed} more minutes or another announcement is playing`);
        }
      });
  }

  playAnnouncement(announcement) {
    console.log('Starting minute-based announcement playback');
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      console.error('Main window not found');
      this.isProcessingAnnouncement = false;
      return;
    }

    // Anons bittiğinde flag'i sıfırla
    require('electron').ipcMain.once('announcement-ended', () => {
      console.log('Minute-based announcement ended, resetting flag');
      this.isProcessingAnnouncement = false;
    });

    mainWindow.webContents.send('play-announcement', announcement);
  }
}

module.exports = new MinuteBasedHandler();
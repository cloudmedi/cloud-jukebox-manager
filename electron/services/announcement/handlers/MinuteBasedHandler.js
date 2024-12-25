const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class MinuteBasedHandler {
  constructor() {
    this.store = new Store();
    this.lastPlayTimes = new Map();
    this.isProcessingAnnouncement = false;
  }

  async check() {
    const announcements = this.store.get('announcements', []);
    const now = new Date();

    for (const announcement of announcements) {
      if (this.shouldPlayAnnouncement(announcement, now)) {
        await this.processAnnouncement(announcement);
      }
    }
  }

  shouldPlayAnnouncement(announcement, now) {
    return (
      announcement.scheduleType === 'minutes' &&
      new Date(announcement.startDate) <= now &&
      new Date(announcement.endDate) >= now &&
      this.hasMinuteIntervalPassed(announcement)
    );
  }

  hasMinuteIntervalPassed(announcement) {
    const lastPlayTime = this.lastPlayTimes.get(announcement._id) || 0;
    const minutesPassed = (Date.now() - lastPlayTime) / (1000 * 60);
    return minutesPassed >= announcement.minuteInterval;
  }

  async processAnnouncement(announcement) {
    console.log('Processing minute-based announcement:', announcement._id);
    
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) {
      console.error('Main window not found');
      return;
    }

    try {
      // Dakika bazlı anonslar için öncelik 1
      mainWindow.webContents.send('play-announcement', announcement, 1);
      this.lastPlayTimes.set(announcement._id, Date.now());
    } catch (error) {
      console.error('Error processing announcement:', error);
    }
  }
}

module.exports = new MinuteBasedHandler();
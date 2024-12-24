const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class SpecificTimeHandler {
  constructor() {
    this.store = new Store();
    this.lastPlayTimes = new Map();
  }

  check() {
    const announcements = this.store.get('announcements', []);
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    announcements
      .filter(announcement => 
        announcement.scheduleType === 'specific' &&
        new Date(announcement.startDate) <= now &&
        new Date(announcement.endDate) >= now
      )
      .forEach(announcement => {
        console.log(`Checking specific-time announcement ${announcement._id}`);
        console.log(`Current time: ${currentTime}`);
        console.log(`Specific times: ${announcement.specificTimes.join(', ')}`);

        if (announcement.specificTimes.includes(currentTime)) {
          const lastPlayTime = this.lastPlayTimes.get(announcement._id);
          const currentTimeStr = now.toISOString();
          
          // Aynı saatte tekrar çalmayı önle
          if (!lastPlayTime || !currentTimeStr.startsWith(lastPlayTime.split('T')[0])) {
            console.log(`Playing specific-time announcement ${announcement._id}`);
            this.playAnnouncement(announcement);
            this.lastPlayTimes.set(announcement._id, currentTimeStr);
          } else {
            console.log(`Already played announcement ${announcement._id} at this time today`);
          }
        }
      });
  }

  playAnnouncement(announcement) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    mainWindow.webContents.send('play-announcement', announcement);
  }
}

module.exports = new SpecificTimeHandler();
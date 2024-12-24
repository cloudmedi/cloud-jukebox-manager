const Store = require('electron-store');
const store = new Store();

class AnnouncementScheduler {
  constructor() {
    this.store = new Store();
    this.currentSchedule = null;
    this.initialize();
  }

  initialize() {
    console.log('Initializing AnnouncementScheduler');
    this.loadSchedule();
  }

  loadSchedule() {
    const announcements = this.store.get('announcements', []);
    const activeAnnouncements = announcements.filter(announcement => 
      announcement.scheduleType === 'songs' &&
      new Date(announcement.startDate) <= new Date() &&
      new Date(announcement.endDate) >= new Date()
    );

    if (activeAnnouncements.length > 0) {
      this.currentSchedule = activeAnnouncements;
      console.log('Loaded active announcements:', this.currentSchedule);
    }
  }

  checkSchedule(songCounter) {
    if (!this.currentSchedule || this.currentSchedule.length === 0) {
      console.log('No active announcements');
      return null;
    }

    // Her anons için kontrol et
    for (const announcement of this.currentSchedule) {
      if (songCounter % announcement.songInterval === 0) {
        console.log(`Announcement triggered after ${songCounter} songs`);
        return announcement;
      }
    }

    return null;
  }

  cleanup() {
    this.currentSchedule = null;
  }
}

module.exports = new AnnouncementScheduler();
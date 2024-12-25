const Store = require('electron-store');
const store = new Store();

class QueueHistory {
  constructor() {
    this.playHistory = new Map();
    this.loadHistory();
    this.setupDailyCleanup();
  }

  loadHistory() {
    const savedHistory = store.get('playHistory', {});
    this.playHistory = new Map(Object.entries(savedHistory));
    console.log('Play history loaded:', this.playHistory.size, 'entries');
  }

  saveHistory() {
    store.set('playHistory', Object.fromEntries(this.playHistory));
  }

  recordPlay(songId) {
    this.playHistory.set(songId, Date.now());
    this.saveHistory();
  }

  getLastPlayedTime(songId) {
    return this.playHistory.get(songId) || 0;
  }

  cleanOldHistory() {
    const currentTime = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    
    let cleaned = 0;
    this.playHistory.forEach((timestamp, songId) => {
      if (currentTime - timestamp > ONE_DAY) {
        this.playHistory.delete(songId);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} old history entries`);
      this.saveHistory();
    }
  }

  setupDailyCleanup() {
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - Date.now();

    setTimeout(() => {
      this.cleanOldHistory();
      this.setupDailyCleanup();
    }, timeUntilMidnight);
  }
}

module.exports = QueueHistory;
const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class MinuteBasedHandler {
  constructor() {
    this.store = new Store();
    this.lastPlayTimes = new Map();
    this.isProcessingAnnouncement = false;
    this.wasPlaylistPlaying = false;
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
      !this.isProcessingAnnouncement &&
      this.hasMinuteIntervalPassed(announcement)
    );
  }

  hasMinuteIntervalPassed(announcement) {
    const lastPlayTime = this.lastPlayTimes.get(announcement._id) || 0;
    const minutesPassed = (Date.now() - lastPlayTime) / (1000 * 60);
    console.log(`Minutes passed for ${announcement._id}: ${minutesPassed}`);
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
      this.isProcessingAnnouncement = true;

      // Playlist durumunu senkron olarak kontrol et
      const isPaused = await mainWindow.webContents.executeJavaScript(
        'document.getElementById("audioPlayer").paused'
      );
      
      this.wasPlaylistPlaying = !isPaused;
      console.log('Current playlist state:', this.wasPlaylistPlaying ? 'playing' : 'paused');

      // Anons bitince çalışacak event listener'ı ayarla
      require('electron').ipcMain.once('announcement-ended', () => {
        console.log('Announcement ended, cleanup started');
        this.cleanupAnnouncement(mainWindow);
      });

      // Anonsu başlat
      mainWindow.webContents.send('play-announcement', announcement);
      
      // Son çalma zamanını kaydet
      this.lastPlayTimes.set(announcement._id, Date.now());
      
    } catch (error) {
      console.error('Error processing announcement:', error);
      this.cleanupAnnouncement(mainWindow);
    }
  }

  cleanupAnnouncement(mainWindow) {
    console.log('Cleaning up announcement, playlist was:', this.wasPlaylistPlaying ? 'playing' : 'paused');
    
    this.isProcessingAnnouncement = false;

    if (this.wasPlaylistPlaying) {
      console.log('Resuming playlist playback');
      mainWindow.webContents.send('resume-playback');
    }

    this.wasPlaylistPlaying = false;
  }
}

module.exports = new MinuteBasedHandler();
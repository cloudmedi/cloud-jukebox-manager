const { BrowserWindow } = require('electron');
const Store = require('electron-store');
const AnnouncementManager = require('../AnnouncementManager').default;

class MinuteBasedHandler {
  constructor() {
    this.store = new Store();
    this.lastPlayTimes = new Map();
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
      !AnnouncementManager.isAnnouncementPlaying() &&
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
      // Anons başlatma izni al
      const canStart = await AnnouncementManager.startAnnouncement(
        announcement._id,
        'minute'
      );

      if (!canStart) {
        console.log('Cannot start announcement - another one is playing');
        return;
      }

      // Playlist durumunu kontrol et
      const isPaused = await mainWindow.webContents.executeJavaScript(
        'document.getElementById("audioPlayer").paused'
      );
      
      AnnouncementManager.savePlaylistState(!isPaused);

      // Anons bitince çalışacak event listener'ı ayarla
      require('electron').ipcMain.once('announcement-ended', () => {
        console.log('Announcement ended, cleanup started');
        const state = AnnouncementManager.endAnnouncement();
        
        if (state.wasPlaying && state.handler === 'minute') {
          console.log('Resuming playlist after minute-based announcement');
          mainWindow.webContents.send('resume-playback');
        }
      });

      // Anonsu başlat
      mainWindow.webContents.send('play-announcement', announcement);
      
      // Son çalma zamanını kaydet
      this.lastPlayTimes.set(announcement._id, Date.now());
      
    } catch (error) {
      console.error('Error processing announcement:', error);
      AnnouncementManager.endAnnouncement();
    }
  }
}

module.exports = new MinuteBasedHandler();
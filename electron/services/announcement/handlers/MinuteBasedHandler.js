const { BrowserWindow } = require('electron');
const Store = require('electron-store');

class MinuteBasedHandler {
  constructor() {
    this.store = new Store();
    this.lastPlayTimes = new Map();
    this.isProcessingAnnouncement = false;
    this.wasPlaylistPlaying = false;
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

    // Playlist durumunu kontrol et
    const playlistAudio = mainWindow.webContents.executeJavaScript('document.getElementById("audioPlayer").paused')
      .then(isPaused => {
        this.wasPlaylistPlaying = !isPaused;
        console.log('Playlist playing state before announcement:', !isPaused);
      })
      .catch(err => {
        console.error('Error checking playlist state:', err);
      });

    // Anons bittiğinde flag'i sıfırla ve playlist'i devam ettir
    require('electron').ipcMain.once('announcement-ended', () => {
      console.log('Minute-based announcement ended, resetting flag');
      this.isProcessingAnnouncement = false;
      
      if (this.wasPlaylistPlaying) {
        console.log('Resuming playlist after minute-based announcement');
        mainWindow.webContents.send('resume-playback');
      }
    });

    mainWindow.webContents.send('play-announcement', announcement);
  }
}

module.exports = new MinuteBasedHandler();
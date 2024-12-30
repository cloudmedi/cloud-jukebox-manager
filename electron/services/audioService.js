const { ipcMain, app } = require('electron');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./websocketService');
const AnnouncementManager = require('./announcement/AnnouncementManager');
const AnnouncementScheduler = require('./announcement/AnnouncementScheduler');

class AudioService {
  constructor() {
    this.currentSound = null;
    this.playlist = null;
    this.currentIndex = 0;
    this.queue = [];
    this.isPlaying = false;
    this.setupIpcHandlers();
    this.setupWebSocketHandlers();
    
    // AnnouncementScheduler'ı başlat
    AnnouncementScheduler.initialize();
  }

  getCurrentSong() {
    console.log('Getting current song, queue:', this.queue);
    console.log('Current index:', this.currentIndex);
    
    if (this.queue && this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
      const currentSong = this.queue[this.currentIndex];
      console.log('Current song found:', currentSong);
      return currentSong;
    }
    console.log('No current song available');
    return null;
  }

  setupWebSocketHandlers() {
    websocketService.addMessageHandler('command', async (message) => {
      console.log('Received command:', message);
      switch (message.command) {
        case 'setVolume':
          this.handleVolumeChange(message.volume);
          break;
        case 'restart':
          this.handleRestart();
          break;
        case 'play':
          this.handlePlay();
          break;
        case 'pause':
          this.handlePause();
          break;
        case 'playAnnouncement':
          await this.handleAnnouncement(message.announcement);
          break;
        default:
          console.log('Unknown command:', message.command);
      }
    });
  }

  async handleAnnouncement(announcement) {
    try {
      const processedAnnouncement = await AnnouncementManager.handleNewAnnouncement(announcement);
      console.log('Announcement processed:', processedAnnouncement);
    } catch (error) {
      console.error('Error handling announcement:', error);
    }
  }

  handleVolumeChange(volume) {
    console.log('Volume change received:', volume);
    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('set-volume', volume);
      websocketService.sendMessage({
        type: 'commandStatus',
        command: 'setVolume',
        status: 'success',
        volume: volume
      });
    }
  }

  handleRestart() {
    console.log('Restarting application...');
    setTimeout(() => {
      app.relaunch();
      app.exit(0);
    }, 1000);
  }

  handlePlay() {
    console.log('Play command received, current state:', this.isPlaying);
    if (!this.isPlaying) {
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('toggle-playback');
        this.isPlaying = true;
        this.sendPlaybackStatus();
      }
    }
  }

  handlePause() {
    console.log('Pause command received, current state:', this.isPlaying);
    if (this.isPlaying) {
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('toggle-playback');
        this.isPlaying = false;
        this.sendPlaybackStatus();
      }
    }
  }

  sendPlaybackStatus() {
    websocketService.sendMessage({
      type: 'playbackStatus',
      status: this.isPlaying ? 'playing' : 'paused'
    });
  }

  setupIpcHandlers() {
    ipcMain.handle('play-playlist', async (event, playlist) => {
      console.log('Playing playlist:', playlist);
      if (this.isPlaying) {
        event.sender.send('toggle-playback');
      }
      this.queue = [...playlist.songs];
      this.playlist = playlist;
      this.currentIndex = 0;
      this.isPlaying = true;
      
      const firstSong = this.queue[this.currentIndex];
      if (firstSong) {
        event.sender.send('update-player', {
          playlist: this.playlist,
          currentSong: firstSong,
          isPlaying: true
        });

        websocketService.sendMessage({
          type: 'playlistStatus',
          status: 'loaded',
          playlistId: playlist._id
        });
      }
    });

    ipcMain.handle('load-playlist', async (event, playlist) => {
      console.log('Loading playlist without auto-play:', playlist);
      this.queue = [...playlist.songs];
      this.playlist = playlist;
      this.currentIndex = 0;
      this.isPlaying = false;
      
      const firstSong = this.queue[this.currentIndex];
      if (firstSong) {
        event.sender.send('update-player', {
          playlist: this.playlist,
          currentSong: firstSong,
          isPlaying: false
        });

        websocketService.sendMessage({
          type: 'playlistStatus',
          status: 'loaded',
          playlistId: playlist._id
        });
      }
    });
  }

  handleNextSong() {
    console.log('Handling next song, current queue:', this.queue);
    if (this.queue.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.queue.length;
      const nextSong = this.queue[this.currentIndex];
      console.log('Next song selected:', nextSong);
      return nextSong;
    }
    return null;
  }

  handleSongDeleted(songId) {
    if (this.currentSound && this.queue[this.currentIndex]._id === songId) {
      this.handleNextSong();
    }
    this.queue = this.queue.filter(song => song._id !== songId);
    if (this.playlist) {
      this.playlist.songs = this.playlist.songs.filter(song => song._id !== songId);
    }
  }
}

module.exports = new AudioService();
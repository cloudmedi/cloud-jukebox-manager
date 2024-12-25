const { ipcMain, app } = require('electron');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./websocketService');
const AnnouncementManager = require('./announcement/AnnouncementManager');
const AnnouncementScheduler = require('./announcement/AnnouncementScheduler');
const CrossfadeManager = require('./audio/CrossfadeManager');
const PlaybackStateManager = require('./audio/PlaybackStateManager');

class AudioService {
  constructor() {
    this.currentSound = null;
    this.playlist = null;
    this.currentIndex = 0;
    this.queue = [];
    this.isPlaying = false;
    this.setupIpcHandlers();
    this.setupWebSocketHandlers();
    
    AnnouncementScheduler.initialize();
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
    console.log('Setting volume to:', volume);
    CrossfadeManager.setVolume(volume);
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
      this.isPlaying = true;
      this.loadCurrentSong();
      this.sendPlaybackStatus();
    } else {
      console.log('Already playing, ignoring play command');
      this.sendPlaybackStatus();
    }
  }

  handlePause() {
    console.log('Pause command received, current state:', this.isPlaying);
    if (this.isPlaying) {
      CrossfadeManager.pause();
      this.isPlaying = false;
      this.sendPlaybackStatus();
    } else {
      console.log('Already paused, ignoring pause command');
      this.sendPlaybackStatus();
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
        CrossfadeManager.stop();
      }
      
      this.queue = [...playlist.songs];
      this.playlist = playlist;
      this.currentIndex = 0;
      this.isPlaying = true;
      
      this.loadCurrentSong();

      websocketService.sendMessage({
        type: 'playlistStatus',
        status: 'loaded',
        playlistId: playlist._id
      });
    });

    ipcMain.handle('load-playlist', async (event, playlist) => {
      console.log('Loading playlist without auto-play:', playlist);
      this.queue = [...playlist.songs];
      this.playlist = playlist;
      this.currentIndex = 0;
      this.isPlaying = false;
      
      const firstSong = this.queue[this.currentIndex];
      if (firstSong) {
        await CrossfadeManager.loadAndPlay(firstSong.localPath);
        CrossfadeManager.pause();

        websocketService.sendMessage({
          type: 'playlistStatus',
          status: 'loaded',
          playlistId: playlist._id
        });
      }
    });

    ipcMain.handle('song-ended', (event) => {
      AnnouncementScheduler.onSongEnd();
      this.handleNextSong();
    });

    ipcMain.on('announcement-ended', (event, { lastPlaylistIndex }) => {
      console.log('Anons bitti, playlist devam ediyor. Son indeks:', lastPlaylistIndex);
      if (this.isPlaying) {
        this.currentIndex = lastPlaylistIndex;
        this.loadCurrentSong();
      }
    });

    ipcMain.on('get-current-playlist', (event) => {
      event.returnValue = {
        currentIndex: this.currentIndex,
        isPlaying: this.isPlaying
      };
    });
  }

  async loadCurrentSong() {
    const currentSong = this.queue[this.currentIndex];
    if (currentSong && currentSong.localPath) {
      console.log('Loading song:', currentSong.name);
      await CrossfadeManager.loadAndPlay(currentSong.localPath);
    }
  }

  handleNextSong() {
    if (this.queue.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.queue.length;
      this.loadCurrentSong();
    }
  }
}

module.exports = new AudioService();
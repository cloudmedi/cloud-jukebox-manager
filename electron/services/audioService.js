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
      // Anonsu indir ve hazırla
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
    console.log('Play command received');
    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('toggle-playback');
      this.isPlaying = true;
      this.sendPlaybackStatus();
    }
  }

  handlePause() {
    console.log('Pause command received');
    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('toggle-playback');
      this.isPlaying = false;
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
    // Playlist durumunu sorgulama
    ipcMain.on('get-current-playlist', (event) => {
      event.returnValue = {
        currentIndex: this.currentIndex,
        isPlaying: this.isPlaying
      };
    });

    ipcMain.handle('play-playlist', async (event, playlist) => {
      console.log('Playing playlist:', playlist);
      
      // Mevcut çalan playlist'i durdur
      if (this.isPlaying) {
        event.sender.send('toggle-playback');
      }
      
      // Yeni playlist'i ayarla
      this.queue = [...playlist.songs];
      this.playlist = playlist;
      this.currentIndex = 0;
      this.isPlaying = true;
      
      // İlk şarkıyı çal
      const firstSong = this.queue[this.currentIndex];
      if (firstSong) {
        event.sender.send('update-player', {
          playlist: this.playlist,
          currentSong: firstSong,
          isPlaying: true
        });

        // Playlist durumunu güncelle
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

    ipcMain.handle('song-ended', (event) => {
      // Anons kontrolü için song-ended eventi
      AnnouncementScheduler.onSongEnd();
      this.handleNextSong(event);
    });

    // Anons bittiğinde çağrılacak
    ipcMain.on('announcement-ended', (event, { lastPlaylistIndex }) => {
      console.log('Anons bitti, playlist devam ediyor. Son indeks:', lastPlaylistIndex);
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow && this.isPlaying) {
        if (typeof lastPlaylistIndex === 'number') {
          this.currentIndex = lastPlaylistIndex;
        }
        const nextSong = this.queue[this.currentIndex];
        if (nextSong) {
          mainWindow.webContents.send('update-player', {
            playlist: this.playlist,
            currentSong: nextSong,
            isPlaying: true
          });
        }
      }
    });
  }

  handleNextSong(event) {
    if (this.queue.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.queue.length;
      const nextSong = this.queue[this.currentIndex];
      
      event.sender.send('update-player', {
        playlist: this.playlist,
        currentSong: nextSong,
        isPlaying: true
      });
    }
  }
}

module.exports = new AudioService();
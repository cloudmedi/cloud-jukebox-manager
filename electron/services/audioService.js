const { ipcMain } = require('electron');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('./websocketService');

class AudioService {
  constructor() {
    this.currentSound = null;
    this.playlist = null;
    this.currentIndex = 0;
    this.queue = [];
    this.isPlaying = false;
    this.setupIpcHandlers();
    this.setupWebSocketHandlers();
  }

  setupWebSocketHandlers() {
    websocketService.addMessageHandler('command', (message) => {
      console.log('Received command:', message);
      switch (message.command) {
        case 'setVolume':
          this.handleVolumeChange(message.volume);
          break;
        case 'restart':
          this.handleRestart();
          break;
        default:
          console.log('Unknown command:', message.command);
      }
    });
  }

  handleVolumeChange(volume) {
    console.log('Setting volume to:', volume);
    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('set-volume', volume);
    }
  }

  handleRestart() {
    console.log('Restarting audio playback');
    const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('restart-playback');
    }
  }

  setupIpcHandlers() {
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

    ipcMain.handle('play-pause', (event) => {
      this.isPlaying = !this.isPlaying;
      event.sender.send('toggle-playback');
      return true;
    });

    ipcMain.handle('next-song', (event) => {
      if (this.queue.length > 0) {
        this.currentIndex = (this.currentIndex + 1) % this.queue.length;
        const nextSong = this.queue[this.currentIndex];
        
        event.sender.send('update-player', {
          playlist: this.playlist,
          currentSong: nextSong,
          isPlaying: true
        });
        return true;
      }
      return false;
    });

    ipcMain.handle('prev-song', (event) => {
      if (this.queue.length > 0) {
        this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
        const prevSong = this.queue[this.currentIndex];
        
        event.sender.send('update-player', {
          playlist: this.playlist,
          currentSong: prevSong,
          isPlaying: true
        });
        return true;
      }
      return false;
    });

    ipcMain.handle('song-ended', (event) => {
      this.handleNextSong(event);
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

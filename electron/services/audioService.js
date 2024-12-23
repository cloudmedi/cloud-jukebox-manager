const { ipcMain } = require('electron');
const path = require('path');

class AudioService {
  constructor() {
    this.currentSound = null;
    this.playlist = null;
    this.currentIndex = 0;
    this.setupIpcHandlers();
  }

  setupIpcHandlers() {
    ipcMain.handle('play-playlist', async (event, playlist) => {
      console.log('Received playlist:', playlist);
      this.playlist = playlist;
      this.currentIndex = 0;
      
      // Playlist'i renderer process'e gönder
      event.sender.send('update-player', {
        playlist: this.playlist,
        currentSong: this.playlist.songs[this.currentIndex]
      });
    });

    ipcMain.handle('play-pause', (event) => {
      event.sender.send('toggle-playback');
      return true;
    });

    ipcMain.handle('next-song', (event) => {
      if (this.playlist && this.playlist.songs.length > 0) {
        this.currentIndex = (this.currentIndex + 1) % this.playlist.songs.length;
        const nextSong = this.playlist.songs[this.currentIndex];
        event.sender.send('update-player', {
          playlist: this.playlist,
          currentSong: nextSong
        });
        return true;
      }
      return false;
    });

    ipcMain.handle('prev-song', (event) => {
      if (this.playlist && this.playlist.songs.length > 0) {
        this.currentIndex = (this.currentIndex - 1 + this.playlist.songs.length) % this.playlist.songs.length;
        const prevSong = this.playlist.songs[this.currentIndex];
        event.sender.send('update-player', {
          playlist: this.playlist,
          currentSong: prevSong
        });
        return true;
      }
      return false;
    });
  }
}

module.exports = new AudioService();
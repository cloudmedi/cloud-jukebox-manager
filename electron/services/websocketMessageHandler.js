const { BrowserWindow } = require('electron');
const Store = require('electron-store');
const fs = require('fs');
const path = require('path');

class WebSocketMessageHandler {
  constructor() {
    this.store = new Store();
    this.handlers = new Map();
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.handlers.set('playlist', this.handlePlaylistMessage.bind(this));
  }

  async handlePlaylistMessage(message) {
    console.log('Playlist message received:', message);
    
    if (message.action === 'songRemoved') {
      await this.handleSongRemoved(message.data);
    }
  }

  async handleSongRemoved({ songId, playlistId }) {
    console.log('Handling song removal:', { songId, playlistId });
    
    try {
      // Store'dan playlistleri al
      const playlists = this.store.get('playlists', []);
      
      // İlgili playlisti bul
      const playlistIndex = playlists.findIndex(p => p._id === playlistId);
      
      if (playlistIndex === -1) {
        console.log('Playlist not found:', playlistId);
        return;
      }

      const playlist = playlists[playlistIndex];
      
      // Silinecek şarkıyı bul
      const songToRemove = playlist.songs.find(s => s._id === songId);
      
      if (!songToRemove) {
        console.log('Song not found in playlist:', songId);
        return;
      }

      console.log('Found song to remove:', songToRemove);

      // Şarkının lokal dosyasını sil
      if (songToRemove.localPath) {
        try {
          fs.unlinkSync(songToRemove.localPath);
          console.log('Deleted local file:', songToRemove.localPath);
          
          // Klasör boşsa klasörü de sil
          const directory = path.dirname(songToRemove.localPath);
          const files = fs.readdirSync(directory);
          if (files.length === 0) {
            fs.rmdirSync(directory);
            console.log('Removed empty directory:', directory);
          }
        } catch (error) {
          console.error('Error deleting local file:', error);
        }
      }

      // Playlistten şarkıyı kaldır
      playlist.songs = playlist.songs.filter(song => song._id !== songId);
      
      // Store'u güncelle
      playlists[playlistIndex] = playlist;
      this.store.set('playlists', playlists);
      
      console.log('Updated playlist in store');

      // Renderer'a bildir
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('songRemoved', {
          songId,
          playlistId
        });
      }
    } catch (error) {
      console.error('Error handling song removal:', error);
    }
  }

  handleMessage(message) {
    console.log('Handling message:', message);
    const handler = this.handlers.get(message.type);
    
    if (handler) {
      handler(message);
    } else {
      console.log('No handler for message type:', message.type);
    }
  }
}

module.exports = new WebSocketMessageHandler();
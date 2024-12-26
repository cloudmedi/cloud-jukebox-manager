const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const { BrowserWindow } = require('electron');

class SongDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('song');
    this.store = new Store();
  }

  async preDelete(id, data) {
    const { playlistId } = data;
    if (!playlistId) {
      throw new Error('Playlist ID is required for song deletion');
    }

    const playlists = this.store.get('playlists', []);
    const playlist = playlists.find(p => p._id === playlistId);
    if (!playlist) {
      throw new Error('Playlist not found');
    }

    const song = playlist.songs.find(s => s._id === id);
    if (!song) {
      throw new Error('Song not found in playlist');
    }
  }

  async executeDelete(id, data) {
    const { playlistId } = data;
    const playlists = this.store.get('playlists', []);
    const playlistIndex = playlists.findIndex(p => p._id === playlistId);
    
    if (playlistIndex !== -1) {
      const playlist = playlists[playlistIndex];
      const song = playlist.songs.find(s => s._id === id);
      
      if (song && song.localPath) {
        try {
          // Şarkı dosyasını sil
          if (fs.existsSync(song.localPath)) {
            fs.unlinkSync(song.localPath);
            console.log(`Deleted song file: ${song.localPath}`);
          }
        } catch (error) {
          console.error(`Error deleting song file: ${error}`);
        }
      }
      
      // Playlist'ten şarkıyı kaldır
      playlist.songs = playlist.songs.filter(s => s._id !== id);
      playlists[playlistIndex] = playlist;
      this.store.set('playlists', playlists);
    }
  }

  async postDelete(id, data) {
    const { playlistId } = data;
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    if (mainWindow) {
      // UI'ı güncelle
      mainWindow.webContents.send('song-deleted', { songId: id, playlistId });
      
      // Eğer silinen şarkı şu an çalıyorsa sonraki şarkıya geç
      const currentPlaylist = this.store.get('currentPlaylist');
      if (currentPlaylist && currentPlaylist._id === playlistId) {
        mainWindow.webContents.send('check-current-song', id);
      }
    }
  }
}

module.exports = SongDeleteHandler;
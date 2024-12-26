const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const fs = require('fs');
const path = require('path');
const { BrowserWindow } = require('electron');

class PlaylistDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('playlist');
    this.store = new Store();
  }

  async preDelete(id) {
    const playlists = this.store.get('playlists', []);
    const playlist = playlists.find(p => p._id === id);
    if (!playlist) {
      throw new Error('Playlist not found');
    }
  }

  async executeDelete(id) {
    const playlists = this.store.get('playlists', []);
    const playlistIndex = playlists.findIndex(p => p._id === id);
    
    if (playlistIndex !== -1) {
      const playlist = playlists[playlistIndex];
      
      // Playlist'in şarkı dosyalarını sil
      playlist.songs.forEach(song => {
        if (song.localPath) {
          try {
            fs.unlinkSync(song.localPath);
            console.log(`Deleted song file: ${song.localPath}`);
            
            // Şarkının bulunduğu klasörü bul
            const playlistDir = path.dirname(song.localPath);
            
            // Klasördeki tüm dosyaları sil
            const files = fs.readdirSync(playlistDir);
            files.forEach(file => {
              const filePath = path.join(playlistDir, file);
              fs.unlinkSync(filePath);
              console.log(`Deleted file: ${filePath}`);
            });
            
            // Boş klasörü sil
            fs.rmdirSync(playlistDir);
            console.log(`Deleted playlist directory: ${playlistDir}`);
          } catch (error) {
            console.error(`Error deleting files/directory: ${error}`);
          }
        }
      });

      // Store'dan playlist'i kaldır
      playlists.splice(playlistIndex, 1);
      this.store.set('playlists', playlists);
    }
  }

  async postDelete(id) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      // UI'ı güncelle
      mainWindow.webContents.send('playlist-deleted', id);
      
      // Eğer silinen playlist şu an çalıyorsa durdur
      const currentPlaylist = this.store.get('currentPlaylist');
      if (currentPlaylist && currentPlaylist._id === id) {
        mainWindow.webContents.send('stop-playback');
        this.store.delete('currentPlaylist');
      }
    }
  }
}

module.exports = PlaylistDeleteHandler;
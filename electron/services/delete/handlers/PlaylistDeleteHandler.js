const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const fs = require('fs');
const path = require('path');

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
    const playlist = playlists.find(p => p._id === id);
    
    // Şarkı dosyalarını sil
    if (playlist && playlist.songs) {
      for (const song of playlist.songs) {
        if (song.localPath && fs.existsSync(song.localPath)) {
          try {
            fs.unlinkSync(song.localPath);
            console.log('Deleted song file:', song.localPath);
            
            // Şarkının bulunduğu klasörü bul ve sil
            const songDir = path.dirname(song.localPath);
            if (fs.existsSync(songDir)) {
              fs.rmdirSync(songDir, { recursive: true });
              console.log('Deleted song directory:', songDir);
            }
          } catch (error) {
            console.error('Error deleting song files:', error);
          }
        }
      }
    }
    
    // Store'dan playlist'i kaldır
    const updatedPlaylists = playlists.filter(p => p._id !== id);
    this.store.set('playlists', updatedPlaylists);
    console.log('Playlist removed from store:', id);
  }

  async postDelete(id) {
    // Player'ı güncelle
    if (global.audioService) {
      global.audioService.handlePlaylistDeleted(id);
    }
  }
}

module.exports = PlaylistDeleteHandler;
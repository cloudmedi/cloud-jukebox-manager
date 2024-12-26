const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const fs = require('fs');
const path = require('path');

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
  }

  async executeDelete(id, data) {
    const { playlistId } = data;
    const playlists = this.store.get('playlists', []);
    const playlist = playlists.find(p => p._id === playlistId);
    
    if (playlist) {
      // Şarkıyı bul
      const song = playlist.songs.find(s => s._id === id);
      
      // Şarkı dosyasını sil
      if (song && song.localPath && fs.existsSync(song.localPath)) {
        try {
          fs.unlinkSync(song.localPath);
          console.log('Deleted song file:', song.localPath);
        } catch (error) {
          console.error('Error deleting song file:', error);
        }
      }
      
      // Playlist'ten şarkıyı kaldır
      playlist.songs = playlist.songs.filter(s => s._id !== id);
      
      // Store'u güncelle
      const updatedPlaylists = playlists.map(p => 
        p._id === playlistId ? playlist : p
      );
      this.store.set('playlists', updatedPlaylists);
      console.log('Song removed from playlist:', id);
    }
  }

  async postDelete(id, data) {
    // Player'ı güncelle
    if (global.audioService) {
      global.audioService.handleSongDeleted(data.playlistId, id);
    }
  }
}

module.exports = SongDeleteHandler;
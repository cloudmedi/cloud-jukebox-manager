const BaseDeleteHandler = require('./BaseDeleteHandler');
const Store = require('electron-store');
const fs = require('fs');
const path = require('path');

class SongDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('song');
    this.store = new Store();
  }

  async preDelete(id) {
    // Tüm playlistleri kontrol et
    const playlists = this.store.get('playlists', []);
    let songFound = false;

    // Şarkıyı içeren playlistleri bul
    for (const playlist of playlists) {
      if (playlist.songs.some(song => song._id === id)) {
        songFound = true;
        break;
      }
    }

    if (!songFound) {
      throw new Error('Song not found in any playlist');
    }
  }

  async executeDelete(id) {
    const playlists = this.store.get('playlists', []);
    let songToDelete = null;
    
    // Her playlist'te şarkıyı ara ve sil
    const updatedPlaylists = playlists.map(playlist => {
      const songIndex = playlist.songs.findIndex(s => s._id === id);
      if (songIndex !== -1) {
        songToDelete = playlist.songs[songIndex];
        playlist.songs = playlist.songs.filter(s => s._id !== id);
      }
      return playlist;
    });

    // Şarkı dosyasını sil
    if (songToDelete && songToDelete.localPath && fs.existsSync(songToDelete.localPath)) {
      try {
        fs.unlinkSync(songToDelete.localPath);
        console.log('Deleted song file:', songToDelete.localPath);
      } catch (error) {
        console.error('Error deleting song file:', error);
      }
    }

    // Store'u güncelle
    this.store.set('playlists', updatedPlaylists);
    console.log('Song removed from playlists:', id);
  }

  async postDelete(id) {
    // Player'ı güncelle
    if (global.audioService) {
      global.audioService.handleSongDeleted(id);
    }
  }
}

module.exports = SongDeleteHandler;
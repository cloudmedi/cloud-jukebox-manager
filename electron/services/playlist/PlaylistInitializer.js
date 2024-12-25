const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const SmartQueueManager = require('../audio/SmartQueueManager');

class PlaylistInitializer {
  constructor() {
    this.store = new Store();
    this.queueManager = SmartQueueManager;
  }

  initializePlaylist(playlist) {
    if (!playlist || !playlist.songs || playlist.songs.length === 0) {
      console.log('No valid playlist to initialize');
      return;
    }

    // SmartQueueManager'ı başlat ve karıştırma yap
    this.queueManager.initializeQueue(playlist.songs);
    
    // İlk şarkıyı seç
    const firstSong = this.queueManager.getCurrentSong();
    
    if (firstSong) {
      console.log('Starting with randomly selected song:', firstSong.name);
      // Playlist'i güncelle ve ilk şarkıyı ayarla
      const updatedPlaylist = {
        ...playlist,
        songs: this.queueManager.getQueue()
      };
      
      // Store'u güncelle
      const playlists = this.store.get('playlists', []);
      const existingIndex = playlists.findIndex(p => p._id === playlist._id);
      
      if (existingIndex !== -1) {
        playlists[existingIndex] = updatedPlaylist;
      } else {
        playlists.push(updatedPlaylist);
      }
      
      this.store.set('playlists', playlists);
      
      return {
        playlist: updatedPlaylist,
        currentSong: firstSong
      };
    }
    
    return null;
  }
}

module.exports = new PlaylistInitializer();
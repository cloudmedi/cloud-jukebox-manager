const Store = require('electron-store');

class PlaybackStore {
  constructor() {
    this.store = new Store();
  }

  setCurrentSong(song) {
    this.store.set('currentSong', song);
    console.log('Current song updated:', song);
  }

  getCurrentSong() {
    return this.store.get('currentSong');
  }

  setCurrentPlaylist(playlist) {
    this.store.set('currentPlaylist', playlist);
    console.log('Current playlist updated:', playlist);
  }

  getCurrentPlaylist() {
    return this.store.get('currentPlaylist');
  }
}

module.exports = new PlaybackStore();
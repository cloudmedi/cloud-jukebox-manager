const Store = require('electron-store');
const store = new Store();

class PlaybackStore {
  constructor() {
    this.store = store;
  }

  setCurrentSong(song) {
    this.store.set('currentSong', song);
  }

  getCurrentSong() {
    return this.store.get('currentSong');
  }

  setCurrentPlaylist(playlist) {
    this.store.set('currentPlaylist', playlist);
  }

  getCurrentPlaylist() {
    return this.store.get('currentPlaylist');
  }

  updatePlaylistDisplay() {
    const currentSong = this.getCurrentSong();
    const currentPlaylist = this.getCurrentPlaylist();

    return {
      artwork: currentPlaylist?.artwork,
      name: currentPlaylist?.name,
      currentSongName: currentSong?.name || 'No song playing',
      currentArtist: currentSong?.artist || 'Unknown Artist'
    };
  }
}

module.exports = new PlaybackStore();
const Store = require('electron-store');
const store = new Store();

class PlaybackStateManager {
  constructor() {
    this.store = new Store();
  }

  savePlaybackState(isPlaying) {
    this.store.set('playbackState', {
      isPlaying,
      timestamp: new Date().toISOString(),
      lastPlaylistId: this.store.get('currentPlaylistId')
    });
    console.log('Playback state saved:', { isPlaying, playlistId: this.store.get('currentPlaylistId') });
  }

  getPlaybackState() {
    const state = this.store.get('playbackState');
    console.log('Retrieved playback state:', state);
    return state ? state.isPlaying : true; // Varsayılan olarak true döndür
  }

  setCurrentPlaylistId(playlistId) {
    this.store.set('currentPlaylistId', playlistId);
    console.log('Current playlist ID set:', playlistId);
  }

  getCurrentPlaylistId() {
    return this.store.get('currentPlaylistId');
  }
}

module.exports = new PlaybackStateManager();
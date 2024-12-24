const Store = require('electron-store');
const store = new Store();

class PlaybackStateManager {
  constructor() {
    this.store = new Store();
  }

  savePlaybackState(isPlaying) {
    const currentState = {
      isPlaying,
      timestamp: new Date().toISOString(),
      lastPlaylistId: this.store.get('currentPlaylistId')
    };
    
    this.store.set('playbackState', currentState);
    console.log('Playback state saved:', currentState);
  }

  getPlaybackState() {
    const state = this.store.get('playbackState');
    if (!state) return true; // Varsayılan olarak çalma durumunu true yap
    console.log('Retrieved playback state:', state);
    return state.isPlaying;
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
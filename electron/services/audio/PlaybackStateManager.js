const Store = require('electron-store');

class PlaybackStateManager {
  constructor() {
    this.store = new Store();
  }

  savePlaybackState(isPlaying, playlistId = null) {
    const state = {
      isPlaying,
      playlistId,
      timestamp: new Date().toISOString()
    };
    
    console.log('Saving playback state:', state);
    this.store.set('playbackState', state);
  }

  getPlaybackState() {
    const state = this.store.get('playbackState');
    console.log('Getting playback state:', state);
    return state || { isPlaying: false, playlistId: null };
  }

  clearPlaybackState() {
    this.store.delete('playbackState');
  }
}

module.exports = new PlaybackStateManager();
const Store = require('electron-store');

class PlaybackStateManager {
  constructor() {
    this.store = new Store();
  }

  savePlaybackState(isPlaying) {
    console.log('Saving playback state:', isPlaying);
    this.store.set('playbackState', {
      isPlaying,
      timestamp: new Date().toISOString()
    });
  }

  getPlaybackState() {
    const state = this.store.get('playbackState');
    console.log('Getting playback state:', state);
    return state ? state.isPlaying : false;
  }

  clearPlaybackState() {
    console.log('Clearing playback state');
    this.store.delete('playbackState');
  }
}

module.exports = PlaybackStateManager;
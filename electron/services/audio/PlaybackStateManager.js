const Store = require('electron-store');

class PlaybackStateManager {
  constructor() {
    this.store = new Store();
  }

  savePlaybackState(isPlaying) {
    this.store.set('playbackState', {
      isPlaying,
      timestamp: new Date().toISOString()
    });
    console.log('Playback state saved:', isPlaying);
  }

  getPlaybackState() {
    const state = this.store.get('playbackState');
    return state ? state.isPlaying : true; // Varsayılan olarak true
  }
}

module.exports = new PlaybackStateManager();

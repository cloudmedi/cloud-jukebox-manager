const Store = require('electron-store');
const store = new Store();

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
    return state ? state.isPlaying : false; // Varsayılan olarak false (duraklatılmış)
  }
}

module.exports = new PlaybackStateManager();
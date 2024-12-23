const Store = require('electron-store');
const store = new Store();

class PlaybackStateManager {
  constructor() {
    this.store = new Store();
  }

  savePlaybackState(isPlaying) {
    console.log('Saving playback state:', isPlaying);
    this.store.set('playbackState', { isPlaying });
  }

  getPlaybackState() {
    const state = this.store.get('playbackState');
    console.log('Getting playback state:', state?.isPlaying);
    return state?.isPlaying ?? false;
  }

  clearPlaybackState() {
    this.store.delete('playbackState');
  }
}

module.exports = new PlaybackStateManager();
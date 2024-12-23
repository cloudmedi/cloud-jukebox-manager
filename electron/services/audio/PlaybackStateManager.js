const Store = require('electron-store');
const store = new Store();

class PlaybackStateManager {
  constructor() {
    this.store = new Store();
  }

  savePlaybackState(isPlaying) {
    this.store.set('playbackState', { isPlaying });
    console.log('Playback state saved:', isPlaying);
  }

  getPlaybackState() {
    const state = this.store.get('playbackState');
    return state?.isPlaying ?? false;
  }

  clearPlaybackState() {
    this.store.delete('playbackState');
  }
}

module.exports = new PlaybackStateManager();
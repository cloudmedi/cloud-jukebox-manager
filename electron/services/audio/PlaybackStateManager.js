const Store = require('electron-store');

class PlaybackStateManager {
  constructor() {
    if (PlaybackStateManager.instance) {
      return PlaybackStateManager.instance;
    }
    
    this.store = new Store();
    PlaybackStateManager.instance = this;
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

// Singleton instance'ı oluştur ve export et
const instance = new PlaybackStateManager();
Object.freeze(instance);

module.exports = instance;
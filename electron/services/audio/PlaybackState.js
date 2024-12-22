const Store = require('electron-store');

class PlaybackState {
  constructor() {
    this.store = new Store();
  }

  update(state, currentSong, playlist, volume) {
    const playbackState = {
      state,
      currentSong,
      playlist,
      volume,
      timestamp: new Date().toISOString()
    };

    this.store.set('playbackState', playbackState);
    console.log('Playback state updated:', state);
  }

  restore() {
    return this.store.get('playbackState');
  }
}

module.exports = PlaybackState;
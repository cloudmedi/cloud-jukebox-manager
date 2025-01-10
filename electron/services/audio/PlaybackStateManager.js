const Store = require('electron-store');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('playback-state');

class PlaybackStateManager {
  constructor() {
    this.store = new Store();
    this.isPlaying = false;
    this.currentMode = null; // 'schedule' veya 'playlist'
    this.initialize();
  }

  initialize() {
    try {
      const state = this.store.get('playbackState', {
        isPlaying: false,
        currentMode: null
      });
      
      this.isPlaying = state.isPlaying;
      this.currentMode = state.currentMode;
      
      logger.info('Playback state initialized:', { isPlaying: this.isPlaying, mode: this.currentMode });
    } catch (error) {
      logger.error('Error initializing playback state:', error);
    }
  }

  setPlaybackState(isPlaying, mode = null) {
    try {
      this.isPlaying = isPlaying;
      if (mode) {
        this.currentMode = mode;
      }
      
      this.savePlaybackState();
      logger.info('Playback state updated:', { isPlaying: this.isPlaying, mode: this.currentMode });
      
      return true;
    } catch (error) {
      logger.error('Error setting playback state:', error);
      return false;
    }
  }

  savePlaybackState() {
    try {
      this.store.set('playbackState', {
        isPlaying: this.isPlaying,
        currentMode: this.currentMode
      });
      
      logger.info('Playback state saved:', { isPlaying: this.isPlaying, mode: this.currentMode });
      return true;
    } catch (error) {
      logger.error('Error saving playback state:', error);
      return false;
    }
  }

  getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      currentMode: this.currentMode
    };
  }

  canStartPlaylist() {
    // Schedule çalıyorsa playlist başlatılamaz
    return this.currentMode !== 'schedule';
  }

  canStartSchedule() {
    // Her zaman schedule başlatılabilir (öncelikli)
    return true;
  }

  reset() {
    try {
      this.isPlaying = false;
      this.currentMode = null;
      this.savePlaybackState();
      logger.info('Playback state reset');
      return true;
    } catch (error) {
      logger.error('Error resetting playback state:', error);
      return false;
    }
  }
}

// Singleton instance
const playbackStateManager = new PlaybackStateManager();
module.exports = playbackStateManager;
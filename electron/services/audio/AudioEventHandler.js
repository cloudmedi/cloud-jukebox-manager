const { ipcRenderer } = require('electron');
const playbackStateManager = require('./PlaybackStateManager');

class AudioEventHandler {
  constructor(audio) {
    this.audio = audio;
    this.currentPlaylistId = null;
    this.setupEventListeners();
  }

  setCurrentPlaylistId(playlistId) {
    this.currentPlaylistId = playlistId;
    console.log('Current playlist ID set:', playlistId);
  }

  setupEventListeners() {
    this.audio.addEventListener('play', () => {
      console.log('Audio started playing');
      playbackStateManager.savePlaybackState(true, this.currentPlaylistId);
      ipcRenderer.send('playback-status-changed', true);
    });

    this.audio.addEventListener('pause', () => {
      console.log('Audio paused');
      playbackStateManager.savePlaybackState(false, this.currentPlaylistId);
      ipcRenderer.send('playback-status-changed', false);
    });

    this.audio.addEventListener('error', (error) => {
      console.error('Audio error occurred:', error);
      playbackStateManager.savePlaybackState(false, this.currentPlaylistId);
      ipcRenderer.send('playback-status-changed', false);
    });

    this.audio.addEventListener('loadstart', () => {
      console.log('Audio loading started');
      const playbackState = playbackStateManager.getPlaybackState();
      if (playbackState.isPlaying && playbackState.playlistId === this.currentPlaylistId) {
        console.log('Auto-playing based on saved state');
        this.audio.play().catch(err => console.error('Auto-play error:', err));
      }
    });
  }
}

module.exports = AudioEventHandler;
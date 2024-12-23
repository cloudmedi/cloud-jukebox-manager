const { ipcRenderer } = require('electron');
const playbackStateManager = require('./PlaybackStateManager');

class AudioEventHandler {
  constructor(audio) {
    this.audio = audio;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.audio.addEventListener('ended', () => {
      console.log('Song ended, playing next');
      ipcRenderer.invoke('song-ended');
    });

    this.audio.addEventListener('play', () => {
      console.log('Audio started playing');
      playbackStateManager.savePlaybackState(true);
      ipcRenderer.send('playback-status-changed', true);
    });

    this.audio.addEventListener('pause', () => {
      console.log('Audio paused');
      playbackStateManager.savePlaybackState(false);
      ipcRenderer.send('playback-status-changed', false);
    });
  }
}

module.exports = AudioEventHandler;
const { ipcRenderer } = require('electron');
const playbackStateManager = require('./PlaybackStateManager');

class AudioEventHandler {
  constructor(playlistAudio) {
    this.playlistAudio = playlistAudio;
    this.campaignAudio = document.getElementById('campaignPlayer');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Playlist audio event listeners
    this.playlistAudio.addEventListener('ended', () => {
      console.log('Song ended, playing next');
      ipcRenderer.invoke('song-ended');
    });

    this.playlistAudio.addEventListener('play', () => {
      console.log('Audio started playing');
      playbackStateManager.savePlaybackState(true);
      ipcRenderer.send('playback-status-changed', true);
    });

    this.playlistAudio.addEventListener('pause', () => {
      console.log('Audio paused');
      playbackStateManager.savePlaybackState(false);
      ipcRenderer.send('playback-status-changed', false);
    });

    // Campaign audio event listeners
    this.campaignAudio.addEventListener('play', () => {
      console.log('Campaign started, pausing playlist');
      this.playlistAudio.pause();
    });

    this.campaignAudio.addEventListener('ended', () => {
      console.log('Campaign ended, resuming playlist');
      this.playlistAudio.play().catch(err => console.error('Resume playback error:', err));
    });
  }

  // Kampanya çalma metodu
  playCampaign(audioUrl) {
    if (audioUrl) {
      console.log('Playing campaign:', audioUrl);
      this.campaignAudio.src = audioUrl;
      this.campaignAudio.play().catch(err => console.error('Campaign playback error:', err));
    }
  }

  // Ses seviyesi kontrolü
  setVolume(volume) {
    const normalizedVolume = volume / 100;
    this.playlistAudio.volume = normalizedVolume;
    this.campaignAudio.volume = normalizedVolume;
  }
}

module.exports = AudioEventHandler;
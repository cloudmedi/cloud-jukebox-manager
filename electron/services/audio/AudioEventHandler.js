const { ipcRenderer } = require('electron');
const playbackStateManager = require('./PlaybackStateManager');

class AudioEventHandler {
  constructor(audio) {
    this.audio = audio;
    this.setupEventListeners();
    this.announcementAudio = null; // Initialize announcement audio
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

    // Add announcement event listeners
    ipcRenderer.on('play-announcement', (event, announcement) => {
      console.log('Playing announcement:', announcement);
      if (announcement.localPath) {
        this.announcementAudio = new Audio(announcement.localPath);
        this.announcementAudio.volume = this.audio.volume;
        this.announcementAudio.play().catch(err => {
          console.error('Announcement playback error:', err);
        });
      }
    });

    ipcRenderer.on('stop-announcement', () => {
      console.log('Stopping announcement');
      if (this.announcementAudio) {
        this.announcementAudio.pause();
        this.announcementAudio.currentTime = 0;
      }
    });

    ipcRenderer.on('pause-playlist', () => {
      console.log('Pausing playlist for announcement');
      if (this.audio) {
        this.audio.pause();
      }
    });

    ipcRenderer.on('resume-playlist', () => {
      console.log('Resuming playlist after announcement');
      if (this.audio) {
        this.audio.play().catch(err => {
          console.error('Playlist resume error:', err);
        });
      }
    });
  }
}

module.exports = AudioEventHandler;

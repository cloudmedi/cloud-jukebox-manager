const QueueManager = require('./SmartQueueManager');
const PlaybackState = require('./PlaybackState');
const path = require('path');
const EmergencyStateManager = require('../emergency/EmergencyStateManager');

class AudioPlayer {
  constructor() {
    this.playbackState = new PlaybackState();
    this.audio = new Audio();
    this.playlist = null;
    this.isPlaying = false;
    this.volume = 1.0;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.audio.addEventListener('ended', () => {
      console.log('Song ended, playing next');
      this.playNext();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.playNext();
    });

    this.audio.addEventListener('play', () => {
      console.log('Audio started playing');
      this.isPlaying = true;
      this.updatePlaybackState('playing');
    });

    this.audio.addEventListener('pause', () => {
      console.log('Audio paused');
      this.isPlaying = false;
      this.updatePlaybackState('paused');
    });
  }

  play() {
    if (this.emergencyManager.isEmergencyActive()) {
      console.log('Playback blocked: Emergency mode is active');
      return false;
    }

    console.log('Play requested');
    if (this.audio.src) {
      this.audio.play().catch(error => {
        console.error('Error playing audio:', error);
        this.playNext();
      });
      this.isPlaying = true;
    } else {
      console.log('No audio source loaded');
      const currentSong = QueueManager.getCurrentSong();
      if (currentSong) {
        this.loadSong(currentSong);
      }
    }
  }

  loadSong(song) {
    if (!song) {
      console.log('No song to load');
      return;
    }

    console.log('Loading song:', song);

    if (!song.localPath) {
      console.error('Song localPath is missing:', song);
      this.playNext();
      return;
    }

    try {
      const normalizedPath = path.normalize(song.localPath);
      console.log('Playing file from:', normalizedPath);
      
      this.audio.pause();
      this.audio.currentTime = 0;
      
      this.audio.src = normalizedPath;
      this.audio.volume = this.volume;
      
      if (this.isPlaying) {
        this.audio.play().catch(error => {
          console.error('Error playing audio:', error);
          this.playNext();
        });
      }
    } catch (error) {
      console.error('Error loading song:', error);
      this.playNext();
    }
  }

  playNext() {
    console.log('Playing next song');
    const nextSong = QueueManager.getNextSong();
    if (nextSong) {
      console.log('Next song found:', nextSong.name);
      this.loadSong(nextSong);
    } else {
      console.log('No more songs in queue');
      this.stop();
    }
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
  }

  setVolume(volume) {
    this.volume = volume / 100;
    this.audio.volume = this.volume;
  }

  updatePlaybackState(state) {
    this.playbackState.update(
      state,
      QueueManager.getCurrentSong(),
      this.playlist,
      this.volume * 100
    );
  }

  getCurrentState() {
    return {
      isPlaying: this.isPlaying,
      currentSong: QueueManager.getCurrentSong(),
      playlist: this.playlist,
      volume: this.volume * 100
    };
  }
}

module.exports = new AudioPlayer();
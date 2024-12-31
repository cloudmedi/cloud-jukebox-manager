const QueueManager = require('./audio/QueueManager');
const PlaybackState = require('./audio/PlaybackState');
const path = require('path');
const websocketService = require('./websocketService');

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
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
      websocketService.sendPlaybackStatus('playing');
    });

    this.audio.addEventListener('pause', () => {
      console.log('Audio paused');
      this.isPlaying = false;
      this.updatePlaybackState('paused');
      websocketService.sendPlaybackStatus('paused');
    });
  }

  play() {
    if (this.audio.src) {
      this.audio.play().catch(error => {
        console.error('Error playing audio:', error);
        this.playNext();
      });
      this.isPlaying = true;
    } else {
      console.log('No audio source loaded');
      const currentSong = this.queueManager.getCurrentSong();
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
    const nextSong = this.queueManager.next();
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
    console.log('AudioPlayer setVolume called:', { 
      rawVolume: volume,
      normalizedVolume: volume / 100 
    });
    
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    this.volume = normalizedVolume / 100;
    this.audio.volume = this.volume;
    console.log('Audio element volume set:', this.audio.volume);
  }

  updatePlaybackState(state) {
    this.playbackState.update(
      state,
      this.queueManager.getCurrentSong(),
      this.playlist,
      this.volume * 100
    );
  }

  getCurrentState() {
    return {
      isPlaying: this.isPlaying,
      currentSong: this.queueManager.getCurrentSong(),
      playlist: this.playlist,
      volume: this.volume * 100
    };
  }
}

module.exports = new AudioPlayer();

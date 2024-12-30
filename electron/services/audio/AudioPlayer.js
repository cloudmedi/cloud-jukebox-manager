const QueueManager = require('./QueueManager');
const PlaybackState = require('./PlaybackState');
const path = require('path');
const EmergencyStateManager = require('../emergency/EmergencyStateManager');
const Store = require('electron-store');
const store = new Store();
const websocketService = require('../websocketService');

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
    this.playbackState = new PlaybackState();
    this.audio = new Audio();
    this.playlist = null;
    this.isPlaying = false;
    
    // Volume initialization
    const storedVolume = store.get('volume', 70);
    this.volume = storedVolume / 100;
    
    this.setupEventListeners();
    this.initializeVolume();
  }

  initializeVolume() {
    // Set initial volume when audio is ready
    this.audio.addEventListener('loadeddata', () => {
      console.log('Audio loaded, setting initial volume:', this.volume);
      this.audio.volume = this.volume;
      
      // Notify about initial volume
      websocketService.sendMessage({
        type: 'volumeUpdate',
        status: 'success',
        volume: this.volume * 100
      });
    });
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

  setVolume(volume) {
    console.log('Setting volume:', volume);
    
    // Normalize and store volume
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    this.volume = normalizedVolume / 100;
    
    // Save to store
    store.set('volume', normalizedVolume);
    console.log('Volume saved to store:', normalizedVolume);
    
    // Apply to audio element if it exists
    if (this.audio) {
      this.audio.volume = this.volume;
      console.log('Volume applied to audio element:', this.volume);
    }

    // Notify about volume change
    websocketService.sendMessage({
      type: 'volumeUpdate',
      status: 'success',
      volume: normalizedVolume
    });
    
    return normalizedVolume;
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

  handleEmergencyStop() {
    const currentState = {
      wasPlaying: this.isPlaying,
      volume: this.volume,
      currentTime: this.audio.currentTime
    };
    store.set('playbackState', currentState);
    
    this.stop();
    this.audio.volume = 0;
  }

  handleEmergencyReset() {
    const savedState = store.get('playbackState');
    if (savedState) {
      // Restore volume
      this.setVolume(savedState.volume * 100);
      
      if (savedState.wasPlaying) {
        console.log('Restoring playback state after emergency');
        this.audio.currentTime = savedState.currentTime;
        this.play();
      }
    }
  }
}

module.exports = new AudioPlayer();

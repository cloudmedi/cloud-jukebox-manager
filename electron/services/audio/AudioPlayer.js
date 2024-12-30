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
    this.audio = null; // Audio element'i başlangıçta null olarak ayarla
    this.playlist = null;
    this.isPlaying = false;
    
    // Volume initialization
    const storedVolume = store.get('volume', 70);
    console.log('AudioPlayer: Initial stored volume:', storedVolume);
    this.volume = storedVolume / 100;

    // Audio element'i oluştur ve initialize et
    this.initializeAudio();
  }

  initializeAudio() {
    console.log('AudioPlayer: Initializing audio element');
    this.audio = new Audio();
    
    // Volume ayarını hemen uygula
    this.audio.volume = this.volume;
    console.log('AudioPlayer: Initial volume set:', this.volume);

    // Event listeners
    this.audio.addEventListener('loadeddata', () => {
      console.log('AudioPlayer: Audio loaded, current volume:', this.audio.volume);
      // Volume'u tekrar kontrol et ve uygula
      this.audio.volume = this.volume;
      console.log('AudioPlayer: Volume reapplied after load:', this.volume);
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('ended', () => {
      console.log('Song ended, playing next');
      this.playNext();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      this.playNext();
    });

    this.audio.addEventListener('play', () => {
      console.log('Audio started playing, volume:', this.audio.volume);
      this.isPlaying = true;
      this.updatePlaybackState('playing');
    });

    this.audio.addEventListener('pause', () => {
      console.log('Audio paused');
      this.isPlaying = false;
      this.updatePlaybackState('paused');
    });

    // Volume değişikliklerini dinle
    this.audio.addEventListener('volumechange', () => {
      console.log('AudioPlayer: Volume changed:', this.audio.volume);
    });
  }

  setVolume(volume) {
    console.log('AudioPlayer: Setting volume:', volume);
    
    // Normalize volume
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    this.volume = normalizedVolume / 100;
    
    // Store'a kaydet
    store.set('volume', normalizedVolume);
    console.log('AudioPlayer: Volume saved to store:', normalizedVolume);
    
    // Audio element'e uygula
    if (this.audio) {
      this.audio.volume = this.volume;
      console.log('AudioPlayer: Volume applied to audio:', this.audio.volume);
    } else {
      console.warn('AudioPlayer: No audio element available');
    }

    // WebSocket bildirimi
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
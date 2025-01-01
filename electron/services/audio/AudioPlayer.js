const QueueManager = require('./QueueManager');
const PlaybackState = require('./PlaybackState');
const path = require('path');
const { Howl } = require('howler');
const EmergencyStateManager = require('../emergency/EmergencyStateManager');
const Store = require('electron-store');
const store = new Store();

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
    this.playbackState = new PlaybackState();
    this.sound = null;
    this.playlist = null;
    this.isPlaying = false;
    this.volume = 1.0;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Howler events will be set up when loading songs
  }

  play() {
    if (EmergencyStateManager.isEmergencyActive()) {
      console.log('Playback blocked: Emergency mode is active');
      return false;
    }

    console.log('Play requested');
    if (this.sound) {
      this.sound.play();
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
      
      // Stop current sound if exists
      if (this.sound) {
        this.sound.stop();
        this.sound.unload();
      }
      
      // Create new Howl instance
      this.sound = new Howl({
        src: [normalizedPath],
        volume: this.volume,
        onend: () => {
          console.log('Song ended');
          this.playNext();
        },
        onloaderror: (id, error) => {
          console.error('Error loading audio:', error);
          this.playNext();
        },
        onplayerror: (id, error) => {
          console.error('Error playing audio:', error);
          this.playNext();
        }
      });
      
      if (this.isPlaying) {
        this.sound.play();
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
    if (this.sound) {
      this.sound.stop();
    }
    this.isPlaying = false;
  }

  setVolume(volume) {
    console.log('AudioPlayer setVolume called:', { 
      rawVolume: volume,
      normalizedVolume: volume / 100 
    });
    
    // Volume değerini 0-100 arasında tut
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    console.log('Volume normalized:', normalizedVolume);
    
    // 0-100 arasındaki değeri 0-1 arasına dönüştür
    this.volume = normalizedVolume / 100;
    if (this.sound) {
      this.sound.volume(this.volume);
    }
    console.log('Audio volume set:', this.volume);

    // Store'a kaydet
    store.set('volume', normalizedVolume);
    console.log('Volume saved to store:', normalizedVolume);
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

  handleEmergencyStop() {
    const currentState = {
      wasPlaying: this.isPlaying,
      volume: this.volume,
      currentTime: this.sound ? this.sound.seek() : 0
    };
    store.set('playbackState', currentState);
    
    this.stop();
    if (this.sound) {
      this.sound.volume(0);
    }
  }

  handleEmergencyReset() {
    const savedState = store.get('playbackState');
    if (savedState) {
      this.volume = savedState.volume;
      if (this.sound) {
        this.sound.volume(this.volume);
        if (savedState.wasPlaying) {
          console.log('Restoring playback state after emergency');
          this.sound.seek(savedState.currentTime);
          this.play();
        }
      }
    }
  }
}

module.exports = new AudioPlayer();
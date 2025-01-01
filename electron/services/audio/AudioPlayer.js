const { Howl } = require('howler');
const QueueManager = require('./QueueManager');
const PlaybackState = require('./PlaybackState');
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
    this.volume = store.get('volume', 70) / 100;
  }

  loadAndPlay(song) {
    if (!song || !song.localPath) {
      console.error('Invalid song data:', song);
      return;
    }

    if (EmergencyStateManager.isEmergencyActive()) {
      console.log('Playback blocked: Emergency mode is active');
      return;
    }

    // Mevcut sesi durdur
    if (this.sound) {
      this.sound.stop();
      this.sound.unload();
    }

    console.log('Loading song:', song.name, 'from:', song.localPath);

    // Yeni Howl instance'ı oluştur
    this.sound = new Howl({
      src: [song.localPath],
      volume: this.volume,
      onend: () => {
        console.log('Song ended, playing next');
        this.playNext();
      },
      onload: () => {
        console.log('Song loaded successfully');
        if (this.isPlaying) {
          this.sound.play();
        }
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

    // Çalmaya başla
    this.sound.play();
    this.isPlaying = true;
    this.updatePlaybackState('playing');
  }

  addToQueue(song) {
    this.queueManager.addSong(song);
  }

  playNext() {
    const nextSong = this.queueManager.next();
    if (nextSong) {
      this.loadAndPlay(nextSong);
    }
  }

  play() {
    if (this.sound) {
      this.sound.play();
      this.isPlaying = true;
      this.updatePlaybackState('playing');
    }
  }

  pause() {
    if (this.sound) {
      this.sound.pause();
      this.isPlaying = false;
      this.updatePlaybackState('paused');
    }
  }

  stop() {
    if (this.sound) {
      this.sound.stop();
      this.isPlaying = false;
      this.updatePlaybackState('stopped');
    }
  }

  setVolume(volume) {
    this.volume = Math.min(Math.max(volume / 100, 0), 1);
    if (this.sound) {
      this.sound.volume(this.volume);
    }
    store.set('volume', volume);
  }

  updatePlaybackState(state) {
    this.playbackState.update(
      state,
      this.queueManager.getCurrentSong(),
      this.playlist,
      this.volume * 100
    );
  }

  handleEmergencyStop() {
    store.set('playbackState', {
      wasPlaying: this.isPlaying,
      volume: this.volume,
      currentTime: this.sound ? this.sound.seek() : 0
    });
    
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
          this.sound.seek(savedState.currentTime);
          this.play();
        }
      }
    }
  }
}

module.exports = new AudioPlayer();
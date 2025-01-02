const QueueManager = require('./QueueManager');
const PlaybackState = require('./PlaybackState');
const path = require('path');
const EmergencyStateManager = require('../emergency/EmergencyStateManager');
const Store = require('electron-store');
const { Howl } = require('howler');
const store = new Store();

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
    this.playbackState = new PlaybackState();
    this.sound = null;
    this.playlist = null;
    this.isPlaying = false;
    this.volume = 1.0;
    this.pendingFirstChunk = null;
    this.readyToPlay = false;

    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.sound) {
      this.sound.on('end', () => {
        console.log('Song ended, playing next');
        this.playNext();
      });

      this.sound.on('play', () => {
        console.log('Audio started playing');
        this.isPlaying = true;
        this.updatePlaybackState('playing');
      });

      this.sound.on('pause', () => {
        console.log('Audio paused');
        this.isPlaying = false;
        this.updatePlaybackState('paused');
      });

      this.sound.on('loaderror', (id, err) => {
        console.error('Audio loading error:', err);
        this.playNext();
      });
    }
  }

  handleFirstSongReady(songId, songPath) {
    console.log('First song ready handler called:', { songId, songPath });
    
    try {
      if (!songPath) {
        console.error('No song path provided to handleFirstSongReady');
        return;
      }

      // Create a new Howl instance for the song
      if (this.sound) {
        this.sound.unload();
      }

      this.sound = new Howl({
        src: [songPath],
        html5: true,
        volume: this.volume,
        format: ['mp3'],
        onload: () => {
          console.log('First song loaded successfully');
          this.readyToPlay = true;
          if (this.isPlaying) {
            this.sound.play();
          }
        },
        onloaderror: (id, error) => {
          console.error('Error loading first song:', error);
        }
      });

      this.setupEventListeners();
      
      console.log('First song initialized successfully');
    } catch (error) {
      console.error('Error in handleFirstSongReady:', error);
    }
  }

  play() {
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

  pause() {
    if (this.sound) {
      this.sound.pause();
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.sound) {
      this.sound.stop();
      this.isPlaying = false;
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

  setVolume(volume) {
    this.volume = volume / 100;
    if (this.sound) {
      this.sound.volume(this.volume);
    }
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

  restoreState() {
    const state = this.playbackState.restore();
    if (state && state.playlist) {
      console.log('Restoring previous state:', state);
      this.loadPlaylist(state.playlist);
      this.setVolume(state.volume);
      
      // Eğer önceki durum 'playing' ise, otomatik başlat
      if (state.state === 'playing') {
        setTimeout(() => {
          console.log('Auto-playing restored playlist');
          this.play();
        }, 1000); // Ses dosyasının yüklenmesi için kısa bir gecikme
      }
    }
  }
}

module.exports = new AudioPlayer();

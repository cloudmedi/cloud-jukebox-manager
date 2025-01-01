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

  handleFirstChunkReady(songId, songPath, buffer) {
    console.log(`First chunk ready for song ${songId}`);
    const currentSong = this.queueManager.getCurrentSong();
    
    if (currentSong && currentSong._id === songId) {
      console.log('Loading first chunk for current song');
      this.loadSongWithBuffer({ ...currentSong, localPath: songPath }, buffer);
    } else {
      console.log('Storing pending first chunk');
      this.pendingFirstChunk = { songId, songPath, buffer };
    }
  }

  loadSongWithBuffer(song, buffer) {
    if (!song) {
      console.log('No song to load');
      return;
    }

    console.log('Loading song with buffer:', song);

    try {
      if (this.sound) {
        this.sound.unload();
      }

      // Buffer'dan blob oluştur
      const blob = new Blob([buffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);

      this.sound = new Howl({
        src: [url],
        html5: true,
        volume: this.volume,
        format: ['mp3'],
        onload: () => {
          console.log('Song loaded successfully');
          this.readyToPlay = true;
          if (this.isPlaying) {
            this.sound.play();
          }
        }
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('Error loading song:', error);
      this.playNext();
    }
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
    console.log('AudioPlayer setVolume called:', { 
      rawVolume: volume,
      normalizedVolume: volume / 100 
    });
    
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    console.log('Volume normalized:', normalizedVolume);
    
    this.volume = normalizedVolume / 100;
    if (this.sound) {
      this.sound.volume(this.volume);
    }
    console.log('Audio volume set:', this.volume);

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
}

module.exports = new AudioPlayer();

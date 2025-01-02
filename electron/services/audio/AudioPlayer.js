const QueueManager = require('./QueueManager');
const PlaybackState = require('./PlaybackState');
const path = require('path');
const Store = require('electron-store');
const store = new Store();
const { createLogger } = require('../../utils/logger');

const logger = createLogger('audio-player');

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
    this.playbackState = new PlaybackState();
    this.audio = new Audio();
    this.playlist = null;
    this.isPlaying = false;
    this.volume = store.get('volume', 100) / 100;
    this.readyToPlay = false;

    this.setupEventListeners();
    logger.info('AudioPlayer initialized');
  }

  setupEventListeners() {
    this.audio.addEventListener('ended', () => {
      logger.info('Song ended, playing next');
      this.playNext();
    });

    this.audio.addEventListener('error', (error) => {
      logger.error('Audio error:', error);
      this.playNext();
    });

    this.audio.addEventListener('play', () => {
      logger.info('Audio started playing');
      this.isPlaying = true;
      this.updatePlaybackState('playing');
    });

    this.audio.addEventListener('pause', () => {
      logger.info('Audio paused');
      this.isPlaying = false;
      this.updatePlaybackState('paused');
    });

    this.audio.addEventListener('loadeddata', () => {
      logger.info('Audio data loaded successfully');
      if (this.isPlaying) {
        this.audio.play().catch(err => {
          logger.error('Error playing audio:', err);
          this.playNext();
        });
      }
    });
  }

  loadPlaylist(playlist) {
    logger.info('Loading playlist:', playlist.name);
    this.playlist = playlist;
    this.queueManager.setQueue(playlist.songs);
    
    if (this.queueManager.getCurrentSong()) {
      this.loadCurrentSong();
    } else {
      logger.warn('No playable songs in playlist');
    }
  }

  loadCurrentSong() {
    const song = this.queueManager.getCurrentSong();
    if (!song) {
      logger.warn('No song to load');
      return;
    }

    logger.info('Loading song:', song.name);

    if (!song.localPath) {
      logger.error('Song localPath is missing:', song);
      this.playNext();
      return;
    }

    try {
      const normalizedPath = path.normalize(song.localPath);
      logger.info('Playing file from:', normalizedPath);
      
      this.audio.src = normalizedPath;
      this.audio.volume = this.volume;
      
      logger.info('Song loaded successfully');
    } catch (error) {
      logger.error('Error loading song:', error);
      this.playNext();
    }
  }

  play() {
    logger.info('Play requested');
    if (this.audio.src) {
      this.audio.play().catch(error => {
        logger.error('Error playing audio:', error);
        this.playNext();
      });
      this.isPlaying = true;
    } else {
      logger.info('No audio source loaded');
      const currentSong = this.queueManager.getCurrentSong();
      if (currentSong) {
        this.loadCurrentSong();
      }
    }
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
  }

  playNext() {
    logger.info('Playing next song');
    const nextSong = this.queueManager.next();
    if (nextSong) {
      logger.info('Next song found:', nextSong.name);
      this.loadCurrentSong();
    } else {
      logger.info('No more songs in queue');
      this.stop();
    }
  }

  setVolume(volume) {
    const normalizedVolume = Math.max(0, Math.min(100, volume));
    this.volume = normalizedVolume / 100;
    this.audio.volume = this.volume;
    store.set('volume', normalizedVolume);
    logger.info('Volume set and saved:', normalizedVolume);
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
      logger.info('Restoring previous state:', state);
      this.loadPlaylist(state.playlist);
      this.setVolume(state.volume);
      
      if (state.state === 'playing') {
        setTimeout(() => {
          logger.info('Auto-playing restored playlist');
          this.play();
        }, 1000);
      }
    }
  }
}

module.exports = new AudioPlayer();
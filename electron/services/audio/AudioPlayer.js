const QueueManager = require('./SmartQueueManager');
const PlaybackState = require('./PlaybackState');
const path = require('path');

class AudioPlayer {
  constructor() {
    this.queueManager = new QueueManager();
    this.playbackState = new PlaybackState();
    this.audio = new Audio();
    this.playlist = null;
    this.isPlaying = false;
    this.volume = 1.0;
    
    // Audio element event listeners
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

    // Uygulama başladığında durumu geri yükle
    this.restoreState();
  }

  loadPlaylist(playlist) {
    console.log('Loading playlist:', playlist);
    this.playlist = playlist;
    this.queueManager.setQueue(playlist.songs);
    
    const currentSong = this.queueManager.getNextSong();
    if (currentSong) {
      this.loadSong(currentSong);
    } else {
      console.log('No playable songs in playlist');
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
      
      // Şarkı yüklendikten sonra çal
      this.audio.addEventListener('loadeddata', () => {
        console.log('Song loaded successfully');
        if (this.isPlaying) {
          this.audio.play().catch(error => {
            console.error('Error playing audio:', error);
            this.playNext();
          });
        }
      });

      // Şarkıyı çalındı olarak işaretle
      this.queueManager.markAsPlayed(song._id);
      
    } catch (error) {
      console.error('Error loading song:', error);
      this.playNext();
    }
  }

  play() {
    console.log('Play requested');
    if (this.audio.src) {
      this.audio.play().catch(error => {
        console.error('Error playing audio:', error);
        this.playNext();
      });
      this.isPlaying = true;
    } else {
      console.log('No audio source loaded');
      const nextSong = this.queueManager.getNextSong();
      if (nextSong) {
        this.loadSong(nextSong);
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
    console.log('Playing next song');
    const nextSong = this.queueManager.getNextSong();
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
    this.audio.volume = this.volume;
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
      
      if (state.state === 'playing') {
        setTimeout(() => {
          console.log('Auto-playing restored playlist');
          this.play();
        }, 1000);
      }
    }
  }
}

module.exports = new AudioPlayer();
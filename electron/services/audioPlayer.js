const QueueManager = require('./audio/QueueManager');
const PlaybackState = require('./audio/PlaybackState');
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

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio.duration > 0 && 
          this.audio.currentTime >= this.audio.duration - 0.5) {
        console.log('Song near end, preparing next');
        const nextSong = this.queueManager.peekNext();
        if (nextSong) {
          console.log('Preloading next song:', nextSong.name);
        }
      }
    });
  }

  loadPlaylist(playlist) {
    console.log('Loading playlist:', playlist);
    this.playlist = playlist;
    this.queueManager.setQueue(playlist.songs);
    
    if (this.queueManager.getCurrentSong()) {
      this.loadCurrentSong();
    } else {
      console.log('No playable songs in playlist');
    }
  }

  loadCurrentSong() {
    const song = this.queueManager.getCurrentSong();
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
            this.playNext(); // Hata durumunda sonraki şarkıya geç
          });
        }
      });
      
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
      this.loadCurrentSong();
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
    const nextSong = this.queueManager.next();
    if (nextSong) {
      console.log('Next song found:', nextSong.name);
      this.loadCurrentSong();
    } else {
      console.log('No more songs in queue');
      this.stop();
    }
  }

  playPrevious() {
    console.log('Playing previous song');
    const prevSong = this.queueManager.previous();
    if (prevSong) {
      console.log('Previous song found:', prevSong.name);
      this.loadCurrentSong();
    }
  }

  setVolume(volume) {
    this.volume = volume / 100;
    this.audio.volume = this.volume;
  }

  shuffle() {
    this.queueManager.shuffle();
    this.loadCurrentSong();
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
      this.loadPlaylist(state.playlist);
      this.setVolume(state.volume);
      if (state.state === 'playing') {
        this.play();
      }
    }
  }
}

module.exports = new AudioPlayer();
const { Howl } = require('howler');
const Store = require('electron-store');

class AudioPlayer {
  constructor() {
    this.store = new Store();
    this.currentSound = null;
    this.playlist = null;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.volume = 1.0;
    this.queue = [];
  }

  loadPlaylist(playlist) {
    console.log('Loading playlist:', playlist);
    this.playlist = playlist;
    this.currentIndex = 0;
    this.queue = [...playlist.songs];
    console.log('Queue updated:', this.queue);
    this.loadCurrentSong();
  }

  loadCurrentSong() {
    if (!this.playlist || !this.queue[this.currentIndex]) {
      console.log('No playlist or song to load');
      return;
    }

    const song = this.queue[this.currentIndex];
    console.log('Loading song:', song);
    
    if (this.currentSound) {
      this.currentSound.unload();
    }

    try {
      this.currentSound = new Howl({
        src: [song.localPath],
        format: ['mp3'],
        html5: true,
        volume: this.volume,
        onload: () => {
          console.log('Song loaded successfully:', song.name);
        },
        onloaderror: (id, error) => {
          console.error('Song loading error:', error);
          console.error('Song path:', song.localPath);
          this.playNext();
        },
        onplay: () => {
          console.log('Song started playing:', song.name);
          this.updatePlaybackState('playing');
        },
        onend: () => {
          console.log('Song ended, playing next');
          this.playNext();
        },
        onpause: () => {
          this.updatePlaybackState('paused');
        },
        onstop: () => {
          this.updatePlaybackState('stopped');
        }
      });
    } catch (error) {
      console.error('Error creating Howl instance:', error);
    }
  }

  play() {
    console.log('Play requested');
    if (this.currentSound) {
      this.currentSound.play();
      this.isPlaying = true;
    } else {
      console.log('No sound loaded to play');
    }
  }

  pause() {
    if (this.currentSound) {
      this.currentSound.pause();
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.currentSound) {
      this.currentSound.stop();
      this.isPlaying = false;
    }
  }

  playNext() {
    if (!this.playlist) return;

    this.currentIndex = (this.currentIndex + 1) % this.queue.length;
    this.loadCurrentSong();
    if (this.isPlaying) {
      this.play();
    }
  }

  playPrevious() {
    if (!this.playlist) return;

    this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
    this.loadCurrentSong();
    if (this.isPlaying) {
      this.play();
    }
  }

  setVolume(volume) {
    this.volume = volume / 100;
    if (this.currentSound) {
      this.currentSound.volume(this.volume);
    }
  }

  shuffle() {
    if (!this.playlist) return;

    // Fisher-Yates shuffle
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }

    // Mevcut şarkıyı başa al
    const currentSong = this.queue[this.currentIndex];
    this.queue = [currentSong, ...this.queue.filter(s => s._id !== currentSong._id)];
    this.currentIndex = 0;
  }

  updatePlaybackState(state) {
    const currentSong = this.queue[this.currentIndex];
    const playbackState = {
      state,
      currentSong,
      playlist: this.playlist,
      volume: this.volume * 100,
      timestamp: new Date().toISOString()
    };

    this.store.set('playbackState', playbackState);
  }

  getCurrentState() {
    return {
      isPlaying: this.isPlaying,
      currentSong: this.queue[this.currentIndex],
      playlist: this.playlist,
      volume: this.volume * 100
    };
  }

  restoreState() {
    const state = this.store.get('playbackState');
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
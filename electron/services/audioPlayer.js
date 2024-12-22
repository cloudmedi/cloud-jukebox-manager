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
    this.queue = playlist.songs.filter(song => song.localPath);
    console.log('Queue updated:', this.queue);
    
    if (this.queue.length > 0) {
      this.loadCurrentSong();
    } else {
      console.log('No playable songs in playlist');
    }
  }

  loadCurrentSong() {
    if (!this.queue[this.currentIndex]) {
      console.log('No song to load at index:', this.currentIndex);
      return;
    }

    const song = this.queue[this.currentIndex];
    console.log('Loading song:', song);

    // Mevcut ses dosyasını güvenli bir şekilde kaldır
    if (this.currentSound) {
      try {
        this.currentSound.stop();
        this.currentSound.unload();
      } catch (error) {
        console.error('Error stopping current sound:', error);
      }
      this.currentSound = null;
    }

    try {
      if (!song.localPath) {
        console.error('Song localPath is missing:', song);
        this.playNext();
        return;
      }

      // Windows tarzı dosya yolunu düzelt ve file:// protokolünü ekle
      const filePath = `file://${song.localPath.replace(/\\/g, '/')}`;
      console.log('Playing file from:', filePath);

      this.currentSound = new Howl({
        src: [filePath],
        html5: true,
        format: ['mp3'],
        volume: this.volume,
        xhr: {
          method: 'GET',
          headers: {
            'Origin': 'electron://cloud-media-player'
          }
        },
        onload: () => {
          console.log('Song loaded successfully:', song.name);
          if (this.isPlaying) {
            this.currentSound.play();
          }
        },
        onloaderror: (id, error) => {
          console.error('Song loading error:', error);
          console.error('Song path:', filePath);
          this.currentSound = null;
          this.playNext();
        },
        onplay: () => {
          console.log('Song started playing:', song.name);
          this.isPlaying = true;
          this.updatePlaybackState('playing');
        },
        onend: () => {
          console.log('Song ended, playing next');
          this.playNext();
        },
        onpause: () => {
          this.isPlaying = false;
          this.updatePlaybackState('paused');
        },
        onstop: () => {
          this.isPlaying = false;
          this.updatePlaybackState('stopped');
        }
      });
    } catch (error) {
      console.error('Error creating Howl instance:', error);
      this.currentSound = null;
      this.playNext();
    }
  }

  play() {
    console.log('Play requested');
    if (this.currentSound) {
      this.currentSound.play();
      this.isPlaying = true;
    } else {
      console.log('No sound loaded to play');
      this.loadCurrentSong();
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
    if (!this.queue || this.queue.length === 0) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.queue.length;
    this.loadCurrentSong();
  }

  playPrevious() {
    if (!this.queue || this.queue.length === 0) return;
    
    this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
    this.loadCurrentSong();
  }

  setVolume(volume) {
    this.volume = volume / 100;
    if (this.currentSound) {
      this.currentSound.volume(this.volume);
    }
  }

  shuffle() {
    if (!this.queue || this.queue.length === 0) return;

    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }

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
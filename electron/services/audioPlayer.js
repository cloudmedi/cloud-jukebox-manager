const { Howl } = require('howler');
const path = require('path');
const fs = require('fs');

class AudioPlayer {
  constructor() {
    this.currentSound = null;
    this.playlist = null;
    this.currentIndex = 0;
    this.isPlaying = false;
    this.volume = 1.0;
  }

  loadPlaylist(playlist) {
    this.playlist = playlist;
    this.currentIndex = 0;
    this.loadCurrentSong();
  }

  loadCurrentSong() {
    if (!this.playlist || !this.playlist.songs[this.currentIndex]) return;

    const song = this.playlist.songs[this.currentIndex];
    const songPath = path.join(this.playlist.localPath, `${song._id}.mp3`);

    if (!fs.existsSync(songPath)) {
      console.error('Şarkı dosyası bulunamadı:', songPath);
      this.playNext();
      return;
    }

    if (this.currentSound) {
      this.currentSound.unload();
    }

    this.currentSound = new Howl({
      src: [songPath],
      html5: true,
      volume: this.volume,
      onend: () => {
        this.playNext();
      },
      onloaderror: (id, error) => {
        console.error('Şarkı yükleme hatası:', error);
        this.playNext();
      }
    });
  }

  play() {
    if (this.currentSound) {
      this.currentSound.play();
      this.isPlaying = true;
    }
  }

  pause() {
    if (this.currentSound) {
      this.currentSound.pause();
      this.isPlaying = false;
    }
  }

  playNext() {
    if (!this.playlist) return;

    this.currentIndex = (this.currentIndex + 1) % this.playlist.songs.length;
    this.loadCurrentSong();
    if (this.isPlaying) {
      this.play();
    }
  }

  playPrevious() {
    if (!this.playlist) return;

    this.currentIndex = (this.currentIndex - 1 + this.playlist.songs.length) % this.playlist.songs.length;
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

  getCurrentSong() {
    if (!this.playlist) return null;
    return this.playlist.songs[this.currentIndex];
  }

  getPlaybackState() {
    return {
      isPlaying: this.isPlaying,
      currentSong: this.getCurrentSong(),
      playlist: this.playlist
    };
  }
}

module.exports = new AudioPlayer();
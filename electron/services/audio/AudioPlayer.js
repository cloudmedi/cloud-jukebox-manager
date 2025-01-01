const { Howl } = require('howler');
const { app } = require('electron');
const path = require('path');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('AudioPlayer');

class AudioPlayer {
  constructor() {
    this.sound = null;
    this.playlist = null;
    this.currentSongIndex = 0;
    this.isPlaying = false;
    this.volume = 1.0;
    
    logger.info('AudioPlayer initialized');
  }

  loadAndPlay(song) {
    if (!song || !song.localPath) {
      logger.error('Invalid song data:', song);
      return;
    }

    logger.info('Loading song:', song.name, 'from:', song.localPath);

    // Mevcut sesi durdur
    if (this.sound) {
      this.sound.stop();
      this.sound.unload();
    }

    // Yeni Howl instance'ı oluştur
    this.sound = new Howl({
      src: [song.localPath],
      volume: this.volume,
      onend: () => {
        logger.info('Song ended, playing next');
        this.playNext();
      },
      onload: () => {
        logger.info('Song loaded successfully');
        if (this.isPlaying) {
          this.sound.play();
        }
      },
      onloaderror: (id, error) => {
        logger.error('Error loading audio:', error);
        this.playNext();
      },
      onplayerror: (id, error) => {
        logger.error('Error playing audio:', error);
        this.playNext();
      }
    });

    // Çalmaya başla
    this.sound.play();
    this.isPlaying = true;
  }

  play() {
    if (this.sound) {
      this.sound.play();
      this.isPlaying = true;
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

  setVolume(volume) {
    this.volume = Math.min(Math.max(volume / 100, 0), 1);
    if (this.sound) {
      this.sound.volume(this.volume);
    }
  }

  playNext() {
    if (this.playlist && this.playlist.songs) {
      this.currentSongIndex = (this.currentSongIndex + 1) % this.playlist.songs.length;
      const nextSong = this.playlist.songs[this.currentSongIndex];
      this.loadAndPlay(nextSong);
    }
  }

  getCurrentSong() {
    if (!this.playlist || !this.playlist.songs) return null;
    return this.playlist.songs[this.currentSongIndex];
  }
}

module.exports = new AudioPlayer();
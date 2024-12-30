const { createLogger } = require('../../utils/logger');
const logger = createLogger('fade-audio-player');

class FadeAudioPlayer {
  constructor() {
    this.audio = new Audio();
    this.fadeDuration = 3; // saniye
    this.fadeStartBeforeEnd = 5; // saniye
    this.isPlaying = false;
    this.currentSong = null;
    this.nextSong = null;
    this.volume = 1.0;
    this.isFading = false;

    // Audio event listeners
    this.audio.addEventListener('timeupdate', () => this.handleTimeUpdate());
    this.audio.addEventListener('ended', () => this.handleEnded());
    this.audio.addEventListener('error', (error) => {
      logger.error('Audio error:', error);
    });
  }

  handleTimeUpdate() {
    if (!this.audio.duration) return;

    const timeRemaining = this.audio.duration - this.audio.currentTime;
    
    // Şarkı sonuna yaklaşıyorsa fade out başlat
    if (timeRemaining <= this.fadeStartBeforeEnd && !this.isFading && this.nextSong) {
      this.startFadeTransition();
    }
  }

  handleEnded() {
    if (this.nextSong) {
      this.currentSong = this.nextSong;
      this.nextSong = null;
      this.playCurrentSong();
    }
  }

  startFadeTransition() {
    if (!this.nextSong || this.isFading) return;

    this.isFading = true;
    const fadeInterval = 50; // 50ms her adım
    const steps = (this.fadeDuration * 1000) / fadeInterval;
    const volumeStep = this.volume / steps;
    let currentStep = 0;

    const fade = setInterval(() => {
      currentStep++;
      const newVolume = this.volume - (volumeStep * currentStep);
      
      if (currentStep >= steps) {
        clearInterval(fade);
        this.audio.volume = 0;
        this.isFading = false;
        this.playNextSong();
      } else {
        this.audio.volume = Math.max(0, newVolume);
      }
    }, fadeInterval);
  }

  async playCurrentSong() {
    if (!this.currentSong) return;

    try {
      this.audio.src = this.currentSong.localPath;
      this.audio.volume = this.volume;
      await this.audio.play();
      this.isPlaying = true;
      logger.info('Started playing:', this.currentSong.name);
    } catch (error) {
      logger.error('Error playing song:', error);
      this.isPlaying = false;
    }
  }

  async playNextSong() {
    if (!this.nextSong) return;

    this.currentSong = this.nextSong;
    this.nextSong = null;
    await this.playCurrentSong();
  }

  setNextSong(song) {
    this.nextSong = song;
    logger.info('Next song set:', song.name);
  }

  setVolume(volume) {
    this.volume = volume;
    this.audio.volume = volume;
  }

  async play(song) {
    this.currentSong = song;
    await this.playCurrentSong();
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
  }

  stop() {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
    this.currentSong = null;
    this.nextSong = null;
  }
}

module.exports = new FadeAudioPlayer();
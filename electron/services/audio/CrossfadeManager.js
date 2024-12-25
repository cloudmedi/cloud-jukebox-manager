const { app } = require('electron');
const path = require('path');

class CrossfadeManager {
  constructor() {
    this.fadeOutDuration = 3000; // 3 saniye
    this.audioA = null;
    this.audioB = null;
    this.currentPlayer = 'A';
    this.isTransitioning = false;
    this.volume = 0.7;
  }

  initialize() {
    if (!this.audioA) {
      this.audioA = {
        source: null,
        volume: this.volume,
        isPlaying: false
      };
    }

    if (!this.audioB) {
      this.audioB = {
        source: null,
        volume: this.volume,
        isPlaying: false
      };
    }
  }

  async loadAndPlay(audioPath) {
    this.initialize();
    
    console.log('Loading audio:', audioPath);
    
    try {
      const targetAudio = this.currentPlayer === 'A' ? this.audioA : this.audioB;
      
      // Mevcut ses kaynağını temizle
      if (targetAudio.source) {
        targetAudio.source = null;
      }

      // Yeni ses kaynağını yükle
      targetAudio.source = audioPath;
      targetAudio.volume = this.volume;
      targetAudio.isPlaying = true;

      console.log('Audio loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading audio:', error);
      return false;
    }
  }

  startTransition() {
    if (this.isTransitioning) return;
    
    console.log('Starting crossfade transition');
    this.isTransitioning = true;

    const currentAudio = this.currentPlayer === 'A' ? this.audioA : this.audioB;
    const nextAudio = this.currentPlayer === 'A' ? this.audioB : this.audioA;

    // Geçiş başlangıcı
    const startTime = Date.now();
    const fadeInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / this.fadeOutDuration, 1);

      // Ses seviyelerini ayarla
      currentAudio.volume = Math.max(0, this.volume * (1 - progress));
      nextAudio.volume = Math.min(this.volume, this.volume * progress);

      if (progress >= 1) {
        clearInterval(fadeInterval);
        this.completeTransition();
      }
    }, 50);
  }

  completeTransition() {
    console.log('Completing transition');
    
    const oldAudio = this.currentPlayer === 'A' ? this.audioA : this.audioB;
    oldAudio.isPlaying = false;
    oldAudio.source = null;
    oldAudio.volume = 0;

    this.currentPlayer = this.currentPlayer === 'A' ? 'B' : 'A';
    this.isTransitioning = false;
  }

  setVolume(volume) {
    const normalizedVolume = volume / 100;
    this.volume = normalizedVolume;
    
    if (this.audioA) {
      this.audioA.volume = normalizedVolume;
    }
    
    if (this.audioB) {
      this.audioB.volume = normalizedVolume;
    }
  }

  pause() {
    if (this.audioA) {
      this.audioA.isPlaying = false;
    }
    if (this.audioB) {
      this.audioB.isPlaying = false;
    }
  }

  stop() {
    this.pause();
    if (this.audioA) {
      this.audioA.source = null;
      this.audioA.volume = 0;
    }
    if (this.audioB) {
      this.audioB.source = null;
      this.audioB.volume = 0;
    }
  }

  getCurrentAudioSource() {
    return this.currentPlayer === 'A' ? 
      this.audioA?.source : 
      this.audioB?.source;
  }
}

module.exports = new CrossfadeManager();
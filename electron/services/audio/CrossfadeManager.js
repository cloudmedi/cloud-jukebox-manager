class CrossfadeManager {
  constructor() {
    this.fadeOutDuration = 3000; // 3 saniye
    this.audioA = new Audio();
    this.audioB = new Audio();
    this.currentPlayer = 'A';
    this.isTransitioning = false;
  }

  initializeAudio(audio) {
    audio.volume = 0.7; // Başlangıç ses seviyesi
    
    audio.addEventListener('timeupdate', () => {
      if (!this.isTransitioning && audio.duration > 0) {
        // Şarkı bitmeden 3 saniye önce geçişi başlat
        if (audio.currentTime >= audio.duration - this.fadeOutDuration / 1000) {
          this.startTransition();
        }
      }
    });

    audio.addEventListener('ended', () => {
      this.completeTransition();
    });
  }

  async loadAndPlay(audioPath) {
    const targetAudio = this.currentPlayer === 'A' ? this.audioA : this.audioB;
    
    try {
      targetAudio.src = audioPath;
      await targetAudio.load();
      await targetAudio.play();
      return true;
    } catch (error) {
      console.error('Error playing audio:', error);
      return false;
    }
  }

  startTransition() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const currentAudio = this.currentPlayer === 'A' ? this.audioA : this.audioB;
    const nextAudio = this.currentPlayer === 'A' ? this.audioB : this.audioA;

    // Geçiş başlangıcı
    const startTime = Date.now();
    const fadeInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / this.fadeOutDuration, 1);

      // Ses seviyelerini ayarla
      currentAudio.volume = Math.max(0, 0.7 * (1 - progress));
      nextAudio.volume = Math.min(0.7, 0.7 * progress);

      if (progress >= 1) {
        clearInterval(fadeInterval);
        this.completeTransition();
      }
    }, 50);
  }

  completeTransition() {
    const oldAudio = this.currentPlayer === 'A' ? this.audioA : this.audioB;
    oldAudio.pause();
    oldAudio.currentTime = 0;
    oldAudio.volume = 0;

    this.currentPlayer = this.currentPlayer === 'A' ? 'B' : 'A';
    this.isTransitioning = false;
  }

  getCurrentTime() {
    return this.currentPlayer === 'A' ? 
      this.audioA.currentTime : 
      this.audioB.currentTime;
  }

  getDuration() {
    return this.currentPlayer === 'A' ? 
      this.audioA.duration : 
      this.audioB.duration;
  }

  setVolume(volume) {
    const normalizedVolume = volume / 100;
    this.audioA.volume = normalizedVolume;
    this.audioB.volume = normalizedVolume;
  }

  pause() {
    this.audioA.pause();
    this.audioB.pause();
  }

  stop() {
    this.pause();
    this.audioA.currentTime = 0;
    this.audioB.currentTime = 0;
  }
}

module.exports = new CrossfadeManager();
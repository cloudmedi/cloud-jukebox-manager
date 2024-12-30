class AudioEventManager {
  constructor(audioElement) {
    this.audio = audioElement;
    this.playbackStatus = document.createElement('div');
    this.playbackStatus.className = 'playback-status stopped';
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Çalma durumu değişikliklerini dinle
    this.audio.addEventListener('play', () => {
      this.playbackStatus.className = 'playback-status playing';
    });

    this.audio.addEventListener('pause', () => {
      this.playbackStatus.className = 'playback-status paused';
    });

    this.audio.addEventListener('ended', () => {
      this.playbackStatus.className = 'playback-status stopped';
    });

    // Hata durumunda
    this.audio.addEventListener('error', () => {
      this.playbackStatus.className = 'playback-status error';
    });
  }

  getPlaybackStatusElement() {
    return this.playbackStatus;
  }
}

module.exports = AudioEventManager;
class PlaybackManager {
  constructor() {
    this.isPlaying = false;
    this.currentSound = null;
    this.playlist = null;
    this.currentIndex = 0;
    this.queue = [];
  }
}

module.exports = PlaybackManager;
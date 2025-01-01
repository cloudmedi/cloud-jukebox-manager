class QueueManager {
  constructor() {
    this.queue = [];
    this.currentIndex = 0;
  }

  setQueue(songs) {
    this.queue = songs.filter(song => song.localPath);
    this.currentIndex = 0;
    console.log('Queue updated:', this.queue);
  }

  getCurrentSong() {
    return this.queue[this.currentIndex];
  }

  peekNext() {
    if (this.queue.length === 0) return null;
    const nextIndex = (this.currentIndex + 1) % this.queue.length;
    return this.queue[nextIndex];
  }

  next() {
    if (this.queue.length === 0) return null;
    this.currentIndex = (this.currentIndex + 1) % this.queue.length;
    return this.getCurrentSong();
  }

  previous() {
    if (this.queue.length === 0) return null;
    this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
    return this.getCurrentSong();
  }

  shuffle() {
    if (this.queue.length === 0) return;

    const currentSong = this.getCurrentSong();
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }

    this.queue = [currentSong, ...this.queue.filter(s => s._id !== currentSong._id)];
    this.currentIndex = 0;
  }
}

module.exports = QueueManager;
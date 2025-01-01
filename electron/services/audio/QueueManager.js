class QueueManager {
  constructor() {
    this.queue = [];
    this.currentIndex = 0;
  }

  addSong(song) {
    this.queue.push(song);
    console.log('Song added to queue:', song.name);
  }

  getCurrentSong() {
    return this.queue[this.currentIndex];
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

  clear() {
    this.queue = [];
    this.currentIndex = 0;
  }

  getQueueLength() {
    return this.queue.length;
  }
}

module.exports = QueueManager;
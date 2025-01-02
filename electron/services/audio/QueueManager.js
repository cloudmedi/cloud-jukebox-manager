class QueueManager {
  constructor() {
    this.queue = [];
    this.currentIndex = 0;
    this.history = [];
  }

  setQueue(songs) {
    console.log('Setting queue with songs:', songs.length);
    this.queue = songs.filter(song => song.localPath || song.filePath);
    this.currentIndex = 0;
    this.history = [];
    console.log('Queue updated, total songs:', this.queue.length);
  }

  getCurrentSong() {
    const song = this.queue[this.currentIndex];
    console.log('Current song:', song?.name || 'No song');
    return song;
  }

  peekNext() {
    if (this.queue.length === 0) return null;
    const nextIndex = (this.currentIndex + 1) % this.queue.length;
    return this.queue[nextIndex];
  }

  next() {
    if (this.queue.length === 0) {
      console.log('Queue is empty');
      return null;
    }
    
    // Add current song to history
    const currentSong = this.getCurrentSong();
    if (currentSong) {
      this.history.push(currentSong);
    }

    this.currentIndex = (this.currentIndex + 1) % this.queue.length;
    const nextSong = this.getCurrentSong();
    console.log('Moving to next song:', nextSong?.name);
    return nextSong;
  }

  previous() {
    if (this.queue.length === 0) {
      console.log('Queue is empty');
      return null;
    }

    if (this.history.length > 0) {
      const previousSong = this.history.pop();
      const index = this.queue.findIndex(song => song._id === previousSong._id);
      if (index !== -1) {
        this.currentIndex = index;
      }
    } else {
      this.currentIndex = (this.currentIndex - 1 + this.queue.length) % this.queue.length;
    }

    const song = this.getCurrentSong();
    console.log('Moving to previous song:', song?.name);
    return song;
  }

  shuffle() {
    if (this.queue.length === 0) return;

    const currentSong = this.getCurrentSong();
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }

    // Current song'u başa al
    this.queue = [currentSong, ...this.queue.filter(s => s._id !== currentSong._id)];
    this.currentIndex = 0;
    this.history = [];
    
    console.log('Queue shuffled');
  }

  getQueue() {
    return this.queue;
  }

  getQueueLength() {
    return this.queue.length;
  }

  getCurrentIndex() {
    return this.currentIndex;
  }

  clearQueue() {
    this.queue = [];
    this.currentIndex = 0;
    this.history = [];
    console.log('Queue cleared');
  }
}

module.exports = QueueManager;
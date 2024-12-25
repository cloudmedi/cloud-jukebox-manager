const QueueHistory = require('./QueueHistory');
const BlacklistManager = require('./BlacklistManager');
const WeightCalculator = require('./WeightCalculator');

class SmartQueueManager {
  constructor() {
    this.queue = [];
    this.currentIndex = -1;
    this.history = new QueueHistory();
    this.blacklist = new BlacklistManager(20);
    this.weightCalculator = new WeightCalculator();
    this.songCounter = 0;
  }

  initializeQueue(songs) {
    console.log('Initializing queue with', songs.length, 'songs');
    this.queue = [...songs];
    this.shuffleQueue();
    this.blacklist.clear();
    this.songCounter = 0;
    
    // Çalınabilir şarkılar arasından rastgele bir başlangıç şarkısı seç
    const playableSongs = this.findPlayableSongs();
    if (playableSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * playableSongs.length);
      this.currentIndex = playableSongs[randomIndex].index;
    } else {
      // Eğer hiç uygun şarkı yoksa, en uzun süre önce çalınanı seç
      this.currentIndex = this.findLeastRecentlyPlayedIndex();
    }
    
    console.log('Starting with song at index:', this.currentIndex);
    return this.getCurrentSong();
  }

  findPlayableSongs() {
    return this.queue
      .map((song, index) => {
        const lastPlayed = this.history.getLastPlayedTime(song._id);
        const weight = this.weightCalculator.calculateWeight(lastPlayed);
        return { song, index, weight, lastPlayed };
      })
      .filter(item => 
        !this.blacklist.has(item.song._id) && // Blacklist'te olmayan
        item.weight > 0 // Çalınabilir durumda olan
      )
      .sort((a, b) => b.weight - a.weight); // Ağırlığa göre sırala
  }

  findLeastRecentlyPlayedIndex() {
    let leastRecentTime = Date.now();
    let leastRecentIndex = 0;

    this.queue.forEach((song, index) => {
      const lastPlayed = this.history.getLastPlayedTime(song._id);
      if (lastPlayed < leastRecentTime) {
        leastRecentTime = lastPlayed;
        leastRecentIndex = index;
      }
    });

    return leastRecentIndex;
  }

  shuffleQueue() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    console.log('Queue shuffled');
  }

  getCurrentSong() {
    if (this.currentIndex === -1 || this.queue.length === 0) return null;
    return this.queue[this.currentIndex];
  }

  getQueue() {
    return this.queue;
  }
}

module.exports = new SmartQueueManager();

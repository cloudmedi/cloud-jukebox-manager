const path = require('path');
const Store = require('electron-store');
const store = new Store();

class SmartQueueManager {
  constructor() {
    this.queue = [];
    this.playHistory = new Map();
    this.currentIndex = -1;
    this.MIN_REPEAT_INTERVAL = 3 * 60 * 60 * 1000; // 3 saat (milisaniye)
    this.loadPlayHistory();
    this.cleanOldHistory();
  }

  loadPlayHistory() {
    const savedHistory = store.get('playHistory', {});
    this.playHistory = new Map(Object.entries(savedHistory));
    console.log('Loaded play history:', this.playHistory);
  }

  cleanOldHistory() {
    const currentTime = Date.now();
    const oneDayAgo = currentTime - (24 * 60 * 60 * 1000);
    
    let cleaned = false;
    this.playHistory.forEach((timestamp, songId) => {
      if (timestamp < oneDayAgo) {
        this.playHistory.delete(songId);
        cleaned = true;
      }
    });

    if (cleaned) {
      this.savePlayHistory();
      console.log('Cleaned old play history entries');
    }
  }

  savePlayHistory() {
    store.set('playHistory', Object.fromEntries(this.playHistory));
  }

  initializeQueue(songs) {
    console.log('Initializing queue with', songs.length, 'songs');
    this.queue = [...songs];
    this.shuffleQueue();
    
    // Rastgele bir başlangıç şarkısı seç
    const playableSongs = this.findPlayableSongs();
    if (playableSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * playableSongs.length);
      this.currentIndex = playableSongs[randomIndex].index;
    } else {
      // Eğer hiç uygun şarkı yoksa, en uzun süre önce çalınanı seç
      this.currentIndex = this.findLeastRecentlyPlayedIndex();
    }
    
    console.log('Starting with song at index:', this.currentIndex);
  }

  shuffleQueue() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    console.log('Queue shuffled');
  }

  findPlayableSongs() {
    const currentTime = Date.now();
    return this.queue.map((song, index) => ({
      song,
      index,
      lastPlayed: this.playHistory.get(song._id) || 0,
      timeSinceLastPlay: currentTime - (this.playHistory.get(song._id) || 0)
    })).filter(({ timeSinceLastPlay }) => 
      timeSinceLastPlay >= this.MIN_REPEAT_INTERVAL
    );
  }

  findLeastRecentlyPlayedIndex() {
    const currentTime = Date.now();
    let maxTimeSincePlay = 0;
    let selectedIndex = 0;

    this.queue.forEach((song, index) => {
      const lastPlayed = this.playHistory.get(song._id) || 0;
      const timeSincePlay = currentTime - lastPlayed;
      if (timeSincePlay > maxTimeSincePlay) {
        maxTimeSincePlay = timeSincePlay;
        selectedIndex = index;
      }
    });

    return selectedIndex;
  }

  getCurrentSong() {
    if (this.currentIndex === -1 || this.queue.length === 0) return null;
    return this.queue[this.currentIndex];
  }

  getNextSong() {
    if (this.queue.length === 0) return null;

    // Şu anki şarkının çalınma zamanını kaydet
    const currentSong = this.getCurrentSong();
    if (currentSong) {
      this.playHistory.set(currentSong._id, Date.now());
      this.savePlayHistory();
    }

    // Çalınabilir şarkıları bul
    const playableSongs = this.findPlayableSongs();
    
    if (playableSongs.length > 0) {
      // Rastgele bir şarkı seç
      const randomIndex = Math.floor(Math.random() * playableSongs.length);
      this.currentIndex = playableSongs[randomIndex].index;
    } else {
      // Eğer hiç uygun şarkı yoksa, en uzun süre önce çalınanı seç
      this.currentIndex = this.findLeastRecentlyPlayedIndex();
    }

    console.log('Next song selected:', {
      index: this.currentIndex,
      song: this.getCurrentSong()?.name
    });

    return this.getCurrentSong();
  }

  clearHistory() {
    this.playHistory.clear();
    store.delete('playHistory');
    console.log('Play history cleared');
  }
}

module.exports = new SmartQueueManager();
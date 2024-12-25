const path = require('path');
const Store = require('electron-store');
const store = new Store();

class SmartQueueManager {
  constructor() {
    this.queue = [];
    this.playHistory = new Map(); // şarkı ID -> son çalınma zamanı
    this.currentIndex = -1;
    this.MIN_REPEAT_INTERVAL = 3 * 60 * 60 * 1000; // 3 saat (milisaniye)
  }

  initializeQueue(songs) {
    this.queue = [...songs];
    this.shuffleQueue();
    console.log('Queue initialized and shuffled with', songs.length, 'songs');
    
    // Geçmiş çalma zamanlarını yükle
    const savedHistory = store.get('playHistory', {});
    this.playHistory = new Map(Object.entries(savedHistory));
    
    // Rastgele bir başlangıç şarkısı seç
    this.currentIndex = this.findPlayableSongIndex();
    console.log('Starting with random song at index:', this.currentIndex);
  }

  shuffleQueue() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  findPlayableSongIndex() {
    const currentTime = Date.now();
    const playableSongs = this.queue.map((song, index) => ({
      song,
      index,
      lastPlayed: this.playHistory.get(song._id) || 0
    }));

    // 3 saat kuralına uyan şarkıları filtrele
    const eligibleSongs = playableSongs.filter(
      ({ lastPlayed }) => (currentTime - lastPlayed) >= this.MIN_REPEAT_INTERVAL
    );

    if (eligibleSongs.length > 0) {
      // Uygun şarkılardan rastgele birini seç
      const randomIndex = Math.floor(Math.random() * eligibleSongs.length);
      return eligibleSongs[randomIndex].index;
    }

    // Uygun şarkı yoksa, en uzun süre önce çalınanı seç
    playableSongs.sort((a, b) => a.lastPlayed - b.lastPlayed);
    return playableSongs[0].index;
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
      
      // Geçmişi store'a kaydet
      store.set('playHistory', Object.fromEntries(this.playHistory));
    }

    // Sonraki uygun şarkıyı bul
    this.currentIndex = this.findPlayableSongIndex();
    return this.getCurrentSong();
  }

  clearHistory() {
    this.playHistory.clear();
    store.delete('playHistory');
  }
}

module.exports = new SmartQueueManager();
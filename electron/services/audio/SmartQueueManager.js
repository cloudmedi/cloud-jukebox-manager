const Store = require('electron-store');
const store = new Store();

class SmartQueueManager {
  constructor() {
    this.queue = [];
    this.playHistory = new Map();
    this.blacklist = new Set(); // Son 20 şarkı için blacklist
    this.currentIndex = -1;
    this.songCounter = 0; // Her 10 şarkıda bir karıştırma için sayaç
    
    // Zaman sabitleri (milisaniye cinsinden)
    this.THREE_HOURS = 3 * 60 * 60 * 1000;
    this.SIX_HOURS = 6 * 60 * 60 * 1000;
    this.ONE_DAY = 24 * 60 * 60 * 1000;

    this.loadPlayHistory();
    this.cleanOldHistory();
    this.setupDailyCleanup();
  }

  loadPlayHistory() {
    const savedHistory = store.get('playHistory', {});
    this.playHistory = new Map(Object.entries(savedHistory));
    console.log('Play history loaded:', this.playHistory.size, 'entries');
  }

  cleanOldHistory() {
    const currentTime = Date.now();
    let cleaned = 0;
    
    this.playHistory.forEach((timestamp, songId) => {
      if (currentTime - timestamp > this.ONE_DAY) {
        this.playHistory.delete(songId);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`Cleaned ${cleaned} old history entries`);
      this.savePlayHistory();
    }
  }

  setupDailyCleanup() {
    // Her gün gece yarısı çalışacak temizlik
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - Date.now();

    setTimeout(() => {
      this.cleanOldHistory();
      this.setupDailyCleanup();
    }, timeUntilMidnight);
  }

  savePlayHistory() {
    store.set('playHistory', Object.fromEntries(this.playHistory));
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
  }

  shuffleQueue() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
    console.log('Queue shuffled');
  }

  calculateWeight(lastPlayed) {
    const currentTime = Date.now();
    const timeSinceLastPlay = currentTime - lastPlayed;

    if (timeSinceLastPlay < this.THREE_HOURS) {
      return 0; // 3 saatten yeni - çalınamaz
    } else if (timeSinceLastPlay < this.SIX_HOURS) {
      return 1; // 3-6 saat arası - düşük öncelik
    } else if (timeSinceLastPlay < this.ONE_DAY) {
      return 2; // 6-24 saat arası - orta öncelik
    } else {
      return 3; // 24 saatten eski - yüksek öncelik
    }
  }

  findPlayableSongs() {
    const currentTime = Date.now();
    
    return this.queue
      .map((song, index) => {
        const lastPlayed = this.playHistory.get(song._id) || 0;
        const weight = this.calculateWeight(lastPlayed);
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
      const lastPlayed = this.playHistory.get(song._id) || 0;
      if (lastPlayed < leastRecentTime) {
        leastRecentTime = lastPlayed;
        leastRecentIndex = index;
      }
    });

    return leastRecentIndex;
  }

  updateBlacklist(songId) {
    this.blacklist.add(songId);
    if (this.blacklist.size > 20) {
      // En eski eklenen şarkıyı çıkar (Set'in ilk elemanı)
      const firstItem = this.blacklist.values().next().value;
      this.blacklist.delete(firstItem);
    }
  }

  getCurrentSong() {
    if (this.currentIndex === -1 || this.queue.length === 0) return null;
    return this.queue[this.currentIndex];
  }

  getNextSong() {
    if (this.queue.length === 0) return null;

    // Mevcut şarkının çalınma zamanını kaydet
    const currentSong = this.getCurrentSong();
    if (currentSong) {
      this.playHistory.set(currentSong._id, Date.now());
      this.updateBlacklist(currentSong._id);
      this.savePlayHistory();
    }

    // Her 10 şarkıda bir yeniden karıştır
    this.songCounter++;
    if (this.songCounter >= 10) {
      this.shuffleQueue();
      this.songCounter = 0;
    }

    // Çalınabilir şarkıları bul ve ağırlıklarına göre seç
    const playableSongs = this.findPlayableSongs();
    
    if (playableSongs.length > 0) {
      // Ağırlıklı rastgele seçim
      const totalWeight = playableSongs.reduce((sum, song) => sum + song.weight, 0);
      let random = Math.random() * totalWeight;
      
      for (const item of playableSongs) {
        random -= item.weight;
        if (random <= 0) {
          this.currentIndex = item.index;
          break;
        }
      }
    } else {
      // Eğer hiç uygun şarkı yoksa, en uzun süre önce çalınanı seç
      this.currentIndex = this.findLeastRecentlyPlayedIndex();
    }

    console.log('Next song selected:', {
      index: this.currentIndex,
      song: this.getCurrentSong()?.name,
      totalSongs: this.queue.length,
      blacklistSize: this.blacklist.size
    });

    return this.getCurrentSong();
  }

  clearHistory() {
    this.playHistory.clear();
    this.blacklist.clear();
    store.delete('playHistory');
    console.log('Play history and blacklist cleared');
  }
}

module.exports = new SmartQueueManager();
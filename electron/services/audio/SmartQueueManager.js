class SmartQueueManager {
  constructor() {
    this.queue = [];
    this.playHistory = new Map(); // şarkı ID -> son çalınma zamanı
    this.MIN_REPEAT_INTERVAL = 3 * 60 * 60 * 1000; // 3 saat (milisaniye)
  }

  setQueue(songs) {
    this.queue = [...songs];
    this.shuffle();
    console.log('Queue initialized with', songs.length, 'songs');
  }

  shuffle() {
    for (let i = this.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.queue[i], this.queue[j]] = [this.queue[j], this.queue[i]];
    }
  }

  getNextSong() {
    const currentTime = Date.now();
    
    // Çalınabilir şarkıları filtrele
    const playableSongs = this.queue.filter(song => {
      const lastPlayedTime = this.playHistory.get(song._id);
      if (!lastPlayedTime) return true;
      return (currentTime - lastPlayedTime) >= this.MIN_REPEAT_INTERVAL;
    });

    console.log('Playable songs:', playableSongs.length);

    // Çalınabilir şarkı yoksa, en eski çalınanı seç
    if (playableSongs.length === 0) {
      let oldestPlayTime = currentTime;
      let selectedSong = this.queue[0];

      this.queue.forEach(song => {
        const lastPlayed = this.playHistory.get(song._id);
        if (lastPlayed < oldestPlayTime) {
          oldestPlayTime = lastPlayed;
          selectedSong = song;
        }
      });

      console.log('No playable songs, selecting oldest played:', selectedSong.name);
      return selectedSong;
    }

    // Rastgele bir şarkı seç
    const randomIndex = Math.floor(Math.random() * playableSongs.length);
    const selectedSong = playableSongs[randomIndex];
    
    console.log('Selected song:', selectedSong.name);
    return selectedSong;
  }

  markAsPlayed(songId) {
    this.playHistory.set(songId, Date.now());
    console.log('Marked as played:', songId);
  }

  clearHistory() {
    this.playHistory.clear();
    console.log('Play history cleared');
  }
}

module.exports = SmartQueueManager;
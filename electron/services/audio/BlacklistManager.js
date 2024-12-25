class BlacklistManager {
  constructor(maxSize = 20) {
    this.blacklist = new Set();
    this.maxSize = maxSize;
  }

  add(songId) {
    if (this.blacklist.size >= this.maxSize) {
      const firstItem = this.blacklist.values().next().value;
      this.blacklist.delete(firstItem);
    }
    this.blacklist.add(songId);
  }

  has(songId) {
    return this.blacklist.has(songId);
  }

  clear() {
    this.blacklist.clear();
  }
}

module.exports = BlacklistManager;
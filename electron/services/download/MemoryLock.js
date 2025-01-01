class MemoryLock {
  constructor() {
    this.locks = new Map();
  }

  async acquire(key) {
    while (this.locks.get(key)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    this.locks.set(key, true);
  }

  release(key) {
    this.locks.delete(key);
  }
}

module.exports = new MemoryLock();
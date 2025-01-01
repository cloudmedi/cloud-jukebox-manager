class MemoryManager {
  constructor() {
    this.memoryUsage = 0;
    this.MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB
    this.cleanupCallbacks = new Set();
  }

  trackMemoryUsage(size, operation = 'add') {
    if (operation === 'add') {
      this.memoryUsage += size;
    } else {
      this.memoryUsage -= size;
    }

    if (this.memoryUsage > this.MAX_MEMORY_USAGE) {
      this.triggerCleanup();
    }
  }

  addCleanupCallback(callback) {
    this.cleanupCallbacks.add(callback);
  }

  removeCleanupCallback(callback) {
    this.cleanupCallbacks.delete(callback);
  }

  triggerCleanup() {
    console.log('Triggering memory cleanup...');
    this.cleanupCallbacks.forEach(callback => callback());
  }

  getMemoryUsage() {
    return this.memoryUsage;
  }
}

module.exports = new MemoryManager();
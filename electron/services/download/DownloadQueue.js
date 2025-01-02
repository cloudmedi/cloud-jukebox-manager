class DownloadQueue {
  constructor() {
    this.queue = [];
  }

  add(item) {
    this.queue.push(item);
  }

  next() {
    return this.queue.shift();
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  size() {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

module.exports = DownloadQueue;
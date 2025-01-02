const { EventEmitter } = require('events');
const { createLogger } = require('../../utils/logger');
const ThrottleController = require('./utils/ThrottleController');

const logger = createLogger('bandwidth-manager');

class BandwidthManager extends EventEmitter {
  constructor() {
    super();
    this.maxConcurrentDownloads = 3;
    this.maxChunkSpeed = 2 * 1024 * 1024; // 2MB/s
    this.activeDownloads = new Map();
    this.throttleController = new ThrottleController(this.maxChunkSpeed);
    
    logger.info('BandwidthManager initialized', {
      maxConcurrentDownloads: this.maxConcurrentDownloads,
      maxChunkSpeed: `${this.maxChunkSpeed / (1024 * 1024)}MB/s`
    });

    this.setupCleanupInterval();
  }

  setupCleanupInterval() {
    // Her 30 saniyede bir temizlik yap
    setInterval(() => {
      this.cleanupStaleDownloads();
    }, 30000);
  }

  cleanupStaleDownloads() {
    const now = Date.now();
    let cleaned = 0;

    for (const [downloadId, download] of this.activeDownloads.entries()) {
      if (now - download.lastActivity > 60000) { // 1 dakika timeout
        logger.warn(`Cleaning up stale download: ${downloadId}`);
        this.activeDownloads.delete(downloadId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} stale downloads`);
    }
  }

  canStartNewDownload() {
    const activeCount = this.activeDownloads.size;
    const canStart = activeCount < this.maxConcurrentDownloads;

    logger.debug('Download start check', {
      activeDownloads: activeCount,
      maxAllowed: this.maxConcurrentDownloads,
      canStart: canStart
    });

    return canStart;
  }

  async startDownload(downloadId) {
    if (!this.canStartNewDownload()) {
      logger.warn('Maximum concurrent downloads reached');
      return false;
    }

    this.activeDownloads.set(downloadId, {
      startTime: Date.now(),
      lastActivity: Date.now(),
      bytesDownloaded: 0,
      currentSpeed: 0,
      status: 'active'
    });

    logger.info(`Started download: ${downloadId}`, {
      activeDownloads: this.activeDownloads.size
    });

    return true;
  }

  async updateProgress(downloadId, bytes) {
    const download = this.activeDownloads.get(downloadId);
    if (!download) {
      logger.warn(`Attempted to update non-existent download: ${downloadId}`);
      return;
    }

    try {
      // Throttle the chunk
      await this.throttleController.throttle(bytes);
      
      const now = Date.now();
      const timeDiff = (now - download.lastActivity) / 1000;
      
      download.bytesDownloaded += bytes;
      download.currentSpeed = bytes / timeDiff;
      download.lastActivity = now;

      this.activeDownloads.set(downloadId, download);

      // Emit progress event
      this.emit('progress', {
        downloadId,
        bytesDownloaded: download.bytesDownloaded,
        currentSpeed: download.currentSpeed,
        timestamp: now
      });

      logger.debug(`Download progress: ${downloadId}`, {
        bytesDownloaded: download.bytesDownloaded / (1024 * 1024),
        currentSpeed: download.currentSpeed / (1024 * 1024),
        activeDownloads: this.activeDownloads.size
      });

    } catch (error) {
      logger.error(`Error updating download progress: ${downloadId}`, error);
      throw error;
    }
  }

  finishDownload(downloadId) {
    const download = this.activeDownloads.get(downloadId);
    if (!download) {
      logger.warn(`Attempted to finish non-existent download: ${downloadId}`);
      return;
    }

    const totalTime = (Date.now() - download.startTime) / 1000;
    const averageSpeed = download.bytesDownloaded / totalTime;

    logger.info(`Download finished: ${downloadId}`, {
      totalBytes: download.bytesDownloaded / (1024 * 1024),
      totalTime,
      averageSpeed: averageSpeed / (1024 * 1024)
    });

    this.activeDownloads.delete(downloadId);
    this.emit('finished', { downloadId, totalBytes: download.bytesDownloaded });
  }

  pauseDownload(downloadId) {
    const download = this.activeDownloads.get(downloadId);
    if (download) {
      download.status = 'paused';
      this.activeDownloads.set(downloadId, download);
      logger.info(`Download paused: ${downloadId}`);
    }
  }

  resumeDownload(downloadId) {
    const download = this.activeDownloads.get(downloadId);
    if (download) {
      download.status = 'active';
      download.lastActivity = Date.now();
      this.activeDownloads.set(downloadId, download);
      logger.info(`Download resumed: ${downloadId}`);
    }
  }

  getDownloadStatus(downloadId) {
    return this.activeDownloads.get(downloadId) || null;
  }

  getAllDownloads() {
    return Array.from(this.activeDownloads.entries()).map(([id, download]) => ({
      id,
      ...download
    }));
  }

  cleanup() {
    this.throttleController.cleanup();
    this.activeDownloads.clear();
    logger.info('BandwidthManager cleaned up');
  }
}

module.exports = new BandwidthManager();
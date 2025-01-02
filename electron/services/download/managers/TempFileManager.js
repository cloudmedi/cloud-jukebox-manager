const fs = require('fs');
const path = require('path');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('temp-file-manager');

class TempFileManager {
  constructor() {
    this.tempFiles = new Map();
    this.cleanupInterval = setInterval(() => this.cleanupOrphanedFiles(), 1800000); // 30 dakika
  }

  createTempFile(songId, targetPath) {
    const tempPath = `${targetPath}.temp`;
    this.tempFiles.set(songId, {
      path: tempPath,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    });
    return tempPath;
  }

  updateLastAccessed(songId) {
    const tempFile = this.tempFiles.get(songId);
    if (tempFile) {
      tempFile.lastAccessed = Date.now();
      this.tempFiles.set(songId, tempFile);
    }
  }

  async finalizeTempFile(songId, targetPath) {
    const tempFile = this.tempFiles.get(songId);
    if (!tempFile) return false;

    try {
      await fs.promises.rename(tempFile.path, targetPath);
      this.tempFiles.delete(songId);
      logger.info(`Temp file finalized: ${songId}`);
      return true;
    } catch (error) {
      logger.error(`Error finalizing temp file: ${songId}`, error);
      return false;
    }
  }

  async cleanupOrphanedFiles() {
    const now = Date.now();
    for (const [songId, tempFile] of this.tempFiles.entries()) {
      // 2 saat boyunca erişilmemiş temp dosyalarını temizle
      if (now - tempFile.lastAccessed > 7200000) {
        try {
          await fs.promises.unlink(tempFile.path);
          this.tempFiles.delete(songId);
          logger.info(`Cleaned up orphaned temp file: ${songId}`);
        } catch (error) {
          logger.error(`Error cleaning up temp file: ${songId}`, error);
        }
      }
    }
  }

  async cleanup() {
    clearInterval(this.cleanupInterval);
    for (const [songId, tempFile] of this.tempFiles.entries()) {
      try {
        await fs.promises.unlink(tempFile.path);
        this.tempFiles.delete(songId);
      } catch (error) {
        logger.error(`Error cleaning up temp file: ${songId}`, error);
      }
    }
  }
}

module.exports = new TempFileManager();
const { WebSocket } = require('ws');
const { createLogger } = require('../../utils/logger');

class ProgressManager {
  constructor() {
    this.logger = createLogger('progress-manager');
    this.ws = null;
    this.deviceToken = null;
    this.playlistId = null;
  }

  initialize(deviceToken, wsUrl, playlistId) {
    this.deviceToken = deviceToken;
    this.playlistId = playlistId;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.on('open', () => {
      this.logger.info('WebSocket connected for progress updates');
    });

    this.ws.on('error', (error) => {
      this.logger.error('WebSocket error:', error);
    });
  }

  async updateProgress(progress, speed, downloadedSongs, totalSongs, estimatedTimeRemaining) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('WebSocket not connected, skipping progress update');
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'downloadProgress',
        deviceToken: this.deviceToken,
        playlistId: this.playlistId,
        progress,
        speed,
        downloadedSongs,
        totalSongs,
        estimatedTimeRemaining
      }));
    } catch (error) {
      this.logger.error('Error sending progress update:', error);
    }
  }

  async markChunkCompleted(chunkId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      this.ws.send(JSON.stringify({
        type: 'chunkCompleted',
        deviceToken: this.deviceToken,
        playlistId: this.playlistId,
        chunkId
      }));
    } catch (error) {
      this.logger.error('Error marking chunk completed:', error);
    }
  }

  reportError(error) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      this.ws.send(JSON.stringify({
        type: 'downloadError',
        deviceToken: this.deviceToken,
        playlistId: this.playlistId,
        error: error.message
      }));
    } catch (err) {
      this.logger.error('Error sending error report:', err);
    }
  }

  reportComplete() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      this.ws.send(JSON.stringify({
        type: 'downloadComplete',
        deviceToken: this.deviceToken,
        playlistId: this.playlistId
      }));
    } catch (error) {
      this.logger.error('Error sending completion report:', error);
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

module.exports = ProgressManager;
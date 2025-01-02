const { createLogger } = require('../../../utils/logger');
const { WebSocket } = require('ws');

class ProgressManager {
  constructor() {
    this.logger = createLogger('progress-manager');
    this.ws = null;
    this.deviceToken = null;
  }

  initialize(deviceToken, wsUrl) {
    this.deviceToken = deviceToken;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.on('open', () => {
      this.logger.info('WebSocket connected for progress updates');
    });

    this.ws.on('error', (error) => {
      this.logger.error('WebSocket error:', error);
    });
  }

  async updateProgress(playlistId, progress) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('WebSocket not connected, skipping progress update');
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'downloadProgress',
        deviceToken: this.deviceToken,
        playlistId,
        progress
      }));
    } catch (error) {
      this.logger.error('Error sending progress update:', error);
    }
  }

  async markChunkCompleted(playlistId, chunkId) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      this.ws.send(JSON.stringify({
        type: 'chunkCompleted',
        deviceToken: this.deviceToken,
        playlistId,
        chunkId
      }));
    } catch (error) {
      this.logger.error('Error marking chunk completed:', error);
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
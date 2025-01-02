const Device = require('../../models/Device');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('status-handler');

class StatusHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handlePlaylistStatus(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) {
        logger.error('Device not found for token:', token);
        return;
      }

      // Update download status with detailed information
      await device.updateDownloadStatus({
        status: message.status,
        currentSong: message.currentSong,
        totalSongs: message.totalSongs || 0,
        downloadedSongs: message.downloadedSongs || 0,
        currentProgress: message.progress || 0,
        downloadSpeed: message.speed || 0,
        estimatedTimeRemaining: message.estimatedTimeRemaining || 0,
        error: message.error
      });

      // If chunk information is provided, update it
      if (message.chunkStatus) {
        await device.updateChunkStatus(
          message.currentSong,
          message.chunkStatus.index,
          message.chunkStatus
        );
      }

      // Broadcast status to admin clients
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        playlistStatus: message.status,
        playlistId: message.playlistId,
        downloadProgress: message.progress || 0,
        downloadSpeed: message.speed || 0,
        downloadedSongs: message.downloadedSongs || 0,
        totalSongs: message.totalSongs || 0,
        estimatedTimeRemaining: message.estimatedTimeRemaining || 0,
        retryCount: message.retryCount || 0,
        lastError: message.error
      });

      logger.info(`Updated playlist status for device ${token} to ${message.status}`);
    } catch (error) {
      logger.error('Error handling playlist status:', error);
    }
  }

  async handleOnlineStatus(token, isOnline) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

      await device.updateStatus(isOnline);
      
      // Check for incomplete downloads when device comes online
      if (isOnline && device.hasIncompleteDownloads()) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        // If download was active in last 5 minutes, resume it
        if (device.downloadStatus.lastUpdated > fiveMinutesAgo) {
          logger.info(`Resuming download for device ${token}`);
          
          // Send resume download command with last known state
          this.wss.sendToDevice(token, {
            type: 'resumeDownload',
            downloadStatus: {
              currentSong: device.downloadStatus.currentSong,
              playlist: device.downloadStatus.playlist,
              songs: device.downloadStatus.songs,
              totalProgress: device.downloadStatus.totalProgress,
              lastChunkIndex: device.downloadStatus.songs.findIndex(s => s.status === 'downloading')
            }
          });
        }
      }
      
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        isOnline: isOnline,
        downloadStatus: device.downloadStatus
      });
    } catch (error) {
      logger.error('Error handling online status:', error);
    }
  }
}

module.exports = StatusHandler;
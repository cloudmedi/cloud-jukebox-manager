const Device = require('../../models/Device');

class StatusHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handlePlaylistStatus(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) {
        console.error('Device not found for token:', token);
        return;
      }

      // İndirme durumunu güncelle
      await device.updateDownloadStatus({
        currentSong: message.currentSong,
        totalSongs: message.totalSongs || 0,
        downloadedSongs: message.downloadedSongs || 0,
        progress: message.progress || 0,
        error: message.error
      });

      // Admin paneline bildir
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

      console.log(`Updated playlist status for device ${token} to ${message.status}`);
    } catch (error) {
      console.error('Error handling playlist status:', error);
    }
  }

  async handleOnlineStatus(token, isOnline) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

      await device.updateStatus(isOnline);
      
      // Cihaz online olduğunda, yarım kalan indirme var mı kontrol et
      if (isOnline && device.downloadStatus?.progress > 0 && device.downloadStatus?.progress < 100) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        
        // Son 5 dakika içinde güncellenmiş ve yarım kalmış indirme varsa
        if (device.downloadStatus.lastUpdated > fiveMinutesAgo) {
          console.log(`Resuming download for device ${token}`);
          
          // Cihaza indirmeye devam etmesi için mesaj gönder
          this.wss.sendToDevice(token, {
            type: 'resumeDownload',
            downloadStatus: device.downloadStatus,
            playlistId: device.activePlaylist
          });
        }
      }
      
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        isOnline: isOnline
      });
    } catch (error) {
      console.error('Error handling online status:', error);
    }
  }
}

module.exports = StatusHandler;
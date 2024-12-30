class StatusHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleOnlineStatus(token, isOnline) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

      device.isOnline = isOnline;
      device.lastSeen = new Date();
      await device.save();

      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        isOnline: isOnline
      });
    } catch (error) {
      console.error('Error handling online status:', error);
    }
  }

  async handlePlaylistStatus(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

      device.playlistStatus = message.status;
      if (message.playlistId) {
        device.activePlaylist = message.playlistId;
      }
      await device.save();

      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        playlistStatus: message.status,
        downloadProgress: message.progress
      });
    } catch (error) {
      console.error('Error handling playlist status:', error);
    }
  }

  async handlePlaybackStatus(token, message) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

      // Cihazın çalan şarkı bilgisini güncelle
      device.currentSongIndex = message.currentSongIndex;
      await device.save();

      // Admin'lere bildir
      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        currentSong: message.currentSong,
        isPlaying: message.status === 'playing'
      });
    } catch (error) {
      console.error('Error handling playback status:', error);
    }
  }

  async handleVolumeChange(token, volume) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

      device.volume = volume;
      await device.save();

      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        volume: volume
      });
    } catch (error) {
      console.error('Error handling volume change:', error);
    }
  }

  async handleEmergencyStop(token) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

      device.emergencyStopped = true;
      device.playlistStatus = 'emergency-stopped';
      await device.save();

      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        emergencyStopped: true,
        playlistStatus: 'emergency-stopped'
      });
    } catch (error) {
      console.error('Error handling emergency stop:', error);
    }
  }

  async handleEmergencyReset(token) {
    try {
      const device = await Device.findOne({ token });
      if (!device) return;

      device.emergencyStopped = false;
      device.playlistStatus = 'loaded';
      await device.save();

      this.wss.broadcastToAdmins({
        type: 'deviceStatus',
        token: token,
        emergencyStopped: false,
        playlistStatus: 'loaded'
      });
    } catch (error) {
      console.error('Error handling emergency reset:', error);
    }
  }
}

module.exports = StatusHandler;
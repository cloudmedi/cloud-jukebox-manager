const PlaylistHandler = require('./PlaylistHandler');
const CommandHandler = require('./CommandHandler');
const StatusHandler = require('./StatusHandler');

class MessageHandler {
  constructor(wss) {
    this.wss = wss;
    this.playlistHandler = new PlaylistHandler(wss);
    this.commandHandler = new CommandHandler(wss);
    this.statusHandler = new StatusHandler(wss);
  }

  async handleMessage(message, deviceToken) {
    console.log('Handling message:', { type: message.type, deviceToken });
    
    switch (message.type) {
      case 'downloadProgress':
        await this.statusHandler.handleDownloadProgress(deviceToken, message);
        break;

      case 'chunkCompleted':
        await this.statusHandler.handleChunkCompleted(deviceToken, message);
        break;

      case 'downloadError':
        await this.statusHandler.handleDownloadError(deviceToken, message);
        break;

      case 'downloadComplete':
        await this.statusHandler.handleDownloadComplete(deviceToken, message);
        break;

      case 'status':
        await this.statusHandler.handleOnlineStatus(deviceToken, message.isOnline);
        break;

      case 'playlistStatus':
        await this.playlistHandler.handlePlaylistStatus(deviceToken, message);
        break;

      case 'playbackStatus':
        this.wss.broadcastToAdmins({
          type: 'deviceStatus',
          token: deviceToken,
          isPlaying: message.status === 'playing'
        });
        break;

      case 'volume':
        const device = await Device.findOne({ token: deviceToken });
        if (!device) return;

        await device.setVolume(message.volume);
        this.wss.broadcastToAdmins({
          type: 'deviceStatus',
          token: deviceToken,
          volume: message.volume
        });
        break;

      case 'screenshot':
        console.log('Screenshot received from device:', deviceToken);
        this.wss.broadcastToAdmins({
          type: 'screenshot',
          token: deviceToken,
          data: message.data
        });
        break;

      case 'error':
        this.wss.broadcastToAdmins({
          type: 'deviceError',
          token: deviceToken,
          error: message.error
        });
        break;

      default:
        console.log('Unknown message type:', message.type);
        break;
    }
  }
}

module.exports = MessageHandler;

const { BrowserWindow } = require('electron');
const playbackStateManager = require('./audio/PlaybackStateManager');

class WebSocketMessageHandler {
  handleMessage(message) {
    console.log('Received WebSocket message:', message);
    
    switch (message.type) {
      case 'command':
        this.handleCommand(message);
        break;
      default:
        console.log('Unknown message type:', message.type);
        break;
    }
  }

  handleCommand(message) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    switch (message.command) {
      case 'play':
        playbackStateManager.savePlaybackState(true, message.playlistId);
        mainWindow.webContents.send('toggle-playback');
        break;
      case 'pause':
        playbackStateManager.savePlaybackState(false, message.playlistId);
        mainWindow.webContents.send('toggle-playback');
        break;
      case 'setVolume':
        mainWindow.webContents.send('set-volume', message.volume);
        break;
      case 'restart':
        mainWindow.webContents.send('restart-playback');
        break;
      default:
        console.log('Unknown command:', message.command);
        break;
    }
  }
}

module.exports = new WebSocketMessageHandler();
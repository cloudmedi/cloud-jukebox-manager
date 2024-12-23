const { app, BrowserWindow } = require('electron');
const { ipcMain } = require('electron');

class WebSocketMessageHandler {
  constructor() {
    this.handlers = new Map();
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.handlers.set('command', this.handleCommand.bind(this));
    this.handlers.set('playlist', this.handlePlaylist.bind(this));
    this.handlers.set('volume', this.handleVolume.bind(this));
  }

  async handleMessage(message) {
    console.log('Processing message:', message);
    const handler = this.handlers.get(message.type);
    
    if (handler) {
      await handler(message);
    } else {
      console.warn('No handler found for message type:', message.type);
    }
  }

  async handleCommand(message) {
    console.log('Handling command:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    if (!mainWindow) {
      console.error('No window found');
      return;
    }

    switch (message.command) {
      case 'restart':
        console.log('Restarting application...');
        app.relaunch();
        app.exit(0);
        break;
      case 'setVolume':
        console.log('Setting volume to:', message.volume);
        mainWindow.webContents.send('set-volume', message.volume);
        break;
      default:
        console.warn('Unknown command:', message.command);
    }
  }

  async handlePlaylist(message) {
    console.log('Handling playlist:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      // Playlist verilerini renderer process'e gönder
      const playlistData = {
        ...message.data,
        songs: message.data.songs.map(song => ({
          _id: song._id,
          name: song.name,
          artist: song.artist,
          filePath: song.filePath,
          duration: song.duration
        }))
      };
      mainWindow.webContents.send('play-playlist', playlistData);
    }
  }

  async handleVolume(message) {
    console.log('Handling volume:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send('set-volume', message.volume);
    }
  }
}

module.exports = new WebSocketMessageHandler();
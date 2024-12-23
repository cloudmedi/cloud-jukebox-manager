const { app } = require('electron');
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
    switch (message.command) {
      case 'restart':
        console.log('Restarting application...');
        app.relaunch();
        app.exit(0);
        break;
      case 'setVolume':
        ipcMain.emit('set-volume', null, message.volume);
        break;
      default:
        console.warn('Unknown command:', message.command);
    }
  }

  async handlePlaylist(message) {
    console.log('Handling playlist:', message);
    ipcMain.emit('play-playlist', null, message.data);
  }

  async handleVolume(message) {
    console.log('Handling volume:', message);
    ipcMain.emit('set-volume', null, message.volume);
  }
}

module.exports = new WebSocketMessageHandler();
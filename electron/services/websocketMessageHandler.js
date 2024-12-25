const { BrowserWindow } = require('electron');
const PlaylistHandler = require('./playlist/PlaylistHandler');

class WebSocketMessageHandler {
  constructor() {
    this.handlers = new Map();
    this.playlistHandler = new PlaylistHandler();
  }

  async handleMessage(message) {
    console.log('Processing message:', message);
    
    switch (message.type) {
      case 'playlist':
        await this.playlistHandler.handlePlaylist(message);
        break;
      case 'command':
        this.handleCommand(message);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  handleCommand(message) {
    console.log('Handling command:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    
    if (!mainWindow) {
      console.log('No main window found');
      return;
    }

    switch (message.command) {
      case 'songRemoved':
        console.log('Handling songRemoved command:', message.data);
        mainWindow.webContents.send('songRemoved', {
          songId: message.data.songId,
          playlistId: message.data.playlistId
        });
        break;

      case 'deleteAnnouncement':
        console.log('Processing deleteAnnouncement command:', message);
        mainWindow.webContents.send('deleteAnnouncement', message.data);
        break;
        
      case 'restart':
        console.log('Restarting application...');
        require('electron').app.relaunch();
        require('electron').app.exit(0);
        break;

      default:
        console.log('Forwarding command to renderer:', message.command);
        mainWindow.webContents.send(message.command, message.data);
        break;
    }
  }
}

module.exports = new WebSocketMessageHandler();
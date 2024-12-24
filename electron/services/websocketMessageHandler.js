const { BrowserWindow, app } = require('electron');
const Store = require('electron-store');
const announcementHandler = require('./announcement/AnnouncementHandler');
const announcementPlayer = require('./announcement/AnnouncementPlayer');

class WebSocketMessageHandler {
  constructor() {
    this.handlers = new Map();
    this.store = new Store();
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.handlers.set('playlist', this.handlePlaylist.bind(this));
    this.handlers.set('command', this.handleCommand.bind(this));
  }

  async handleMessage(message) {
    console.log('Processing message:', message);
    const handler = this.handlers.get(message.type);
    
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        console.error('Message handling error:', error);
        this.sendToRenderer('error', {
          type: 'error',
          message: error.message
        });
      }
    } else {
      console.warn('No handler found for message type:', message.type);
    }
  }

  async handleCommand(message) {
    console.log('Handling command:', message);
    
    switch (message.command) {
      case 'playAnnouncement':
        try {
          console.log('Processing announcement:', message.announcement);
          // Anonsu indir ve sakla
          const storedAnnouncement = await announcementHandler.handleAnnouncement(message.announcement);
          // Anonsu oynat
          await announcementPlayer.playAnnouncement(storedAnnouncement);
        } catch (error) {
          console.error('Error handling announcement:', error);
          throw error;
        }
        break;

      case 'restart':
        console.log('Restarting application...');
        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 1000);
        break;

      default:
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send(message.command, message.data);
        }
        break;
    }
  }

  async handlePlaylist(message) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    try {
      const playlist = message.data;
      if (!playlist || !playlist.songs) {
        throw new Error('Invalid playlist data');
      }

      // Playlist'i store'a kaydet
      const playlists = this.store.get('playlists', []);
      const existingIndex = playlists.findIndex(p => p._id === playlist._id);
      
      if (existingIndex !== -1) {
        playlists[existingIndex] = playlist;
      } else {
        playlists.push(playlist);
      }
      
      this.store.set('playlists', playlists);

      // Renderer'a bildir
      mainWindow.webContents.send('playlist-received', playlist);
      console.log('Playlist processed successfully:', playlist.name);
    } catch (error) {
      console.error('Error processing playlist:', error);
      mainWindow.webContents.send('error', {
        type: 'error',
        message: 'Playlist işlenirken bir hata oluştu'
      });
    }
  }

  sendToRenderer(channel, data) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send(channel, data);
    }
  }
}

module.exports = new WebSocketMessageHandler();

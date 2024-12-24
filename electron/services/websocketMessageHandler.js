const { BrowserWindow } = require('electron');
const Store = require('electron-store');
const AnnouncementHandler = require('./announcement/AnnouncementHandler');
const AnnouncementPlayer = require('./announcement/AnnouncementPlayer');

class WebSocketMessageHandler {
  constructor() {
    this.handlers = new Map();
    this.store = new Store();
    this.announcementHandler = new AnnouncementHandler();
    this.announcementPlayer = new AnnouncementPlayer();
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
          const storedAnnouncement = await this.announcementHandler.handleAnnouncement(message.announcement);
          await this.announcementPlayer.playAnnouncement(storedAnnouncement);
        } catch (error) {
          console.error('Error handling announcement:', error);
          throw error;
        }
        break;

      case 'stopAnnouncement':
        this.announcementPlayer.stopAnnouncement();
        break;

      case 'restart':
        console.log('Restarting application...');
        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 1000);
        break;

      case 'setVolume':
        console.log('Setting volume to:', message.volume);
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send('set-volume', message.volume);
        }
        break;

      case 'play':
        const playWindow = BrowserWindow.getAllWindows()[0];
        if (playWindow) {
          playWindow.webContents.send('toggle-playback');
        }
        break;

      case 'pause':
        const pauseWindow = BrowserWindow.getAllWindows()[0];
        if (pauseWindow) {
          pauseWindow.webContents.send('toggle-playback');
        }
        break;

      default:
        console.log('Unknown command:', message.command);
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

      // Store playlist
      const playlists = this.store.get('playlists', []);
      const existingIndex = playlists.findIndex(p => p._id === playlist._id);
      
      if (existingIndex !== -1) {
        playlists[existingIndex] = playlist;
      } else {
        playlists.push(playlist);
      }
      
      this.store.set('playlists', playlists);

      // Notify renderer
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

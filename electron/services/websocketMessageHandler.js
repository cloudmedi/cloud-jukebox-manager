const { BrowserWindow, app } = require('electron');
const Store = require('electron-store');
const path = require('path');
const { downloadFile } = require('./downloadUtils');

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
          const mainWindow = BrowserWindow.getAllWindows()[0];
          if (!mainWindow) {
            throw new Error('Main window not found');
          }

          // Anons dosyasını indir
          const announcement = message.announcement;
          const fileName = path.basename(announcement.audioFile);
          const downloadPath = path.join(app.getPath('userData'), 'announcements', announcement._id);
          const localPath = path.join(downloadPath, fileName);

          console.log('Downloading announcement to:', localPath);
          
          // Dosyayı indir
          await downloadFile(
            `http://localhost:5000/${announcement.audioFile}`,
            localPath,
            (progress) => {
              console.log(`Download progress: ${progress}%`);
            }
          );

          // Mevcut çalma durumunu kaydet
          const wasPlaying = this.store.get('playback.isPlaying', false);
          console.log('Current playback state:', wasPlaying);

          // Playlist'i duraklat
          if (wasPlaying) {
            console.log('Pausing playlist for announcement');
            mainWindow.webContents.send('pause-playlist');
          }

          // Anonsu oynat
          console.log('Playing announcement');
          mainWindow.webContents.send('play-announcement', {
            ...announcement,
            localPath
          });

          // Anons bitiminde playlist'e geri dön
          setTimeout(() => {
            console.log('Announcement finished');
            mainWindow.webContents.send('stop-announcement');
            
            if (wasPlaying) {
              console.log('Resuming playlist');
              mainWindow.webContents.send('resume-playlist');
            }
          }, announcement.duration * 1000);

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
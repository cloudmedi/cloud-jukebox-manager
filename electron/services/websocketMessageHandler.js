const { BrowserWindow, app } = require('electron');
const { downloadFile } = require('./downloadUtils');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const { createLogger } = require('../utils/logger');

const logger = createLogger('websocket-handler');

class WebSocketMessageHandler {
  constructor() {
    this.handlers = new Map();
    this.store = new Store();
    this.initializeHandlers();
    logger.info('WebSocket message handler initialized');
  }

  initializeHandlers() {
    this.handlers.set('playlist', this.handlePlaylist.bind(this));
    this.handlers.set('command', this.handleCommand.bind(this));
    this.handlers.set('songRemoved', this.handleSongRemoved.bind(this));
    logger.info('Message handlers registered');
  }

  async handleMessage(message) {
    logger.info('Processing message:', { type: message.type });
    const handler = this.handlers.get(message.type);
    
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        logger.error('Message handling error:', {
          type: message.type,
          error: error.message,
          stack: error.stack
        });
        this.sendToRenderer('error', {
          type: 'error',
          message: error.message
        });
      }
    } else {
      logger.warn('No handler found for message type:', message.type);
    }
  }

  handleCommand(message) {
    logger.info('Handling command:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];

    switch (message.command) {
      case 'restart':
        logger.info('Restarting application...');
        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 1000);
        break;
        
      default:
        if (mainWindow) {
          logger.info('Forwarding command to renderer:', message.command);
          mainWindow.webContents.send(message.command, message.data);
        }
        break;
    }
  }

  async handleSongRemoved(message) {
    logger.info('Handling song removal:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    const { songId, playlistId } = message.data;
    
    const playlists = this.store.get('playlists', []);
    const playlistIndex = playlists.findIndex(p => p._id === playlistId);
    
    if (playlistIndex !== -1) {
      logger.info(`Found playlist: ${playlists[playlistIndex].name}`);
      
      const removedSong = playlists[playlistIndex].songs.find(s => s._id === songId);
      playlists[playlistIndex].songs = playlists[playlistIndex].songs.filter(
        song => song._id !== songId
      );
      
      this.store.set('playlists', playlists);
      logger.info('Updated playlists in store');
      
      mainWindow.webContents.send('songRemoved', {
        songId,
        playlistId
      });
      
      if (removedSong && removedSong.localPath) {
        try {
          fs.unlinkSync(removedSong.localPath);
          logger.info('Deleted local song file:', removedSong.localPath);
        } catch (error) {
          logger.error('Error deleting local file:', {
            path: removedSong.localPath,
            error: error.message
          });
        }
      }
    } else {
      logger.warn('Playlist not found:', playlistId);
    }
  }

  async handlePlaylist(message) {
    logger.info('Handling playlist:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    const playlist = message.data;
    if (!playlist || !playlist.songs) {
      logger.error('Invalid playlist data:', playlist);
      return;
    }

    const userDataPath = app.getPath('userData');
    const playlistDir = path.join(
      userDataPath,
      'downloads',
      playlist._id
    );

    if (!fs.existsSync(playlistDir)) {
      fs.mkdirSync(playlistDir, { recursive: true });
      logger.info('Created playlist directory:', playlistDir);
    }

    const storedPlaylist = {
      _id: playlist._id,
      name: playlist.name,
      artwork: playlist.artwork,
      songs: []
    };

    for (const song of playlist.songs) {
      try {
        logger.info('Processing song:', song);
        const songUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
        const filename = `${song._id}${path.extname(song.filePath)}`;
        const localPath = path.join(playlistDir, filename);

        mainWindow.webContents.send('download-progress', {
          songName: song.name,
          progress: 0
        });

        await downloadFile(songUrl, localPath, (progress) => {
          mainWindow.webContents.send('download-progress', {
            songName: song.name,
            progress
          });
        });

        logger.info(`Successfully downloaded song: ${song.name}`);
        storedPlaylist.songs.push({
          ...song,
          localPath
        });

      } catch (error) {
        logger.error(`Error downloading song ${song.name}:`, error);
        mainWindow.webContents.send('download-error', {
          songName: song.name,
          error: error.message
        });
      }
    }

    logger.info('Storing playlist with localPaths:', storedPlaylist);
    mainWindow.webContents.send('playlist-received', storedPlaylist);
  }

  sendToRenderer(channel, data) {
    logger.info('Sending to renderer:', { channel, data });
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send(channel, data);
    } else {
      logger.warn('No main window found to send message');
    }
  }
}

module.exports = new WebSocketMessageHandler();
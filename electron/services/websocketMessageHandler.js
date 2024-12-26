const { BrowserWindow } = require('electron');
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

  handlePlaylist(message) {
    logger.info('Handling playlist message:', message);
    
    if (message.action === 'deleted') {
      logger.info(`Processing playlist deletion for ID: ${message.playlistId}`);
      
      // Get current playlists from store
      const playlists = this.store.get('playlists', []);
      logger.info(`Current playlist count in store: ${playlists.length}`);
      
      // Remove the deleted playlist
      const updatedPlaylists = playlists.filter(p => p._id !== message.playlistId);
      this.store.set('playlists', updatedPlaylists);
      logger.info(`Updated playlist count in store: ${updatedPlaylists.length}`);
      
      // Notify renderer about deletion
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        logger.info('Notifying renderer about playlist deletion');
        mainWindow.webContents.send('playlist-deleted', message.playlistId);
      } else {
        logger.warn('No main window found to notify about playlist deletion');
      }
      
      // Check if deleted playlist is currently playing
      const currentPlaylist = this.store.get('currentPlaylist');
      if (currentPlaylist && currentPlaylist._id === message.playlistId) {
        logger.info('Stopping playback of deleted playlist');
        mainWindow?.webContents.send('stop-playback');
        this.store.delete('currentPlaylist');
      }
      
      logger.info('Playlist deletion handling completed');
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

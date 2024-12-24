const { BrowserWindow, app } = require('electron');
const { downloadFile } = require('./downloadUtils');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
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
          // Anonsu indir ve sakla
          const storedAnnouncement = await announcementHandler.handleAnnouncement(message.announcement);
          // Anonsu oynat
          await announcementPlayer.playAnnouncement(storedAnnouncement);
        } catch (error) {
          console.error('Error handling announcement:', error);
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
    console.log('Handling playlist:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    const playlist = message.data;
    if (!playlist || !playlist.songs) {
      console.error('Invalid playlist data:', playlist);
      return;
    }

    // Playlist için indirme klasörünü oluştur
    const userDataPath = app.getPath('userData');
    const playlistDir = path.join(
      userDataPath,
      'downloads',
      playlist._id
    );

    if (!fs.existsSync(playlistDir)) {
      fs.mkdirSync(playlistDir, { recursive: true });
    }

    // Store'a kaydedilecek playlist objesi
    const storedPlaylist = {
      _id: playlist._id,
      name: playlist.name,
      artwork: playlist.artwork,
      songs: []
    };

    // Her şarkıyı indir ve localPath'leri ekle
    for (const song of playlist.songs) {
      try {
        console.log('Processing song:', song);
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

        // Şarkıyı localPath ile birlikte playlist'e ekle
        storedPlaylist.songs.push({
          ...song,
          localPath
        });

      } catch (error) {
        console.error(`Error downloading song ${song.name}:`, error);
        mainWindow.webContents.send('download-error', {
          songName: song.name,
          error: error.message
        });
      }
    }

    console.log('Storing playlist with localPaths:', storedPlaylist);

    // Playlist'i store'a kaydet ve UI'ı güncelle
    mainWindow.webContents.send('playlist-received', storedPlaylist);
  }

  sendToRenderer(channel, data) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send(channel, data);
    }
  }
}

module.exports = new WebSocketMessageHandler();
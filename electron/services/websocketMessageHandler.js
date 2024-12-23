const { BrowserWindow } = require('electron');
const { downloadFile } = require('./downloadUtils');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');

class WebSocketMessageHandler {
  constructor() {
    this.handlers = new Map();
    this.store = new Store();
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.handlers.set('auth', this.handleAuth.bind(this));
    this.handlers.set('playlist', this.handlePlaylist.bind(this));
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

  handleAuth(message) {
    console.log('Auth message received:', message);
    if (message.status === 'success') {
      this.sendToRenderer('auth-success', message.deviceInfo);
    }
  }

  async handlePlaylist(message) {
    console.log('Playlist message received:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    const playlist = message.data;
    if (!playlist || !playlist.songs) {
      console.error('Invalid playlist data:', playlist);
      return;
    }

    // Playlist için indirme klasörünü oluştur
    const userDataPath = require('electron').app.getPath('userData');
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

    // Her şarkıyı indir
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

    // Playlist'i store'a kaydet ve UI'ı güncelle
    this.store.set(`playlists.${playlist._id}`, storedPlaylist);
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
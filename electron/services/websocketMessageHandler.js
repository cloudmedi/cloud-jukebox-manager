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
    const playlistDir = path.join(
      this.store.get('downloadPath', path.join(app.getPath('userData'), 'downloads')),
      playlist._id
    );

    if (!fs.existsSync(playlistDir)) {
      fs.mkdirSync(playlistDir, { recursive: true });
    }

    // Playlist'i store'a kaydet
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

    // Playlist'i store'a kaydet
    const playlists = this.store.get('playlists', []);
    const existingIndex = playlists.findIndex(p => p._id === playlist._id);
    
    if (existingIndex !== -1) {
      playlists[existingIndex] = storedPlaylist;
    } else {
      playlists.push(storedPlaylist);
    }
    
    this.store.set('playlists', playlists);

    // Renderer'a playlist hazır olduğunu bildir
    mainWindow.webContents.send('playlist-ready', storedPlaylist);
  }

  handleCommand(message) {
    console.log('Handling command:', message);
    // Command işleme mantığı buraya gelecek
  }

  sendToRenderer(channel, data) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send(channel, data);
    }
  }
}

module.exports = new WebSocketMessageHandler();
const { BrowserWindow } = require('electron');
const { downloadFile } = require('./downloadUtils');
const path = require('path');

class WebSocketMessageHandler {
  constructor() {
    this.handlers = new Map();
    this.mainWindow = null;
    this.initializeHandlers();
  }

  initializeHandlers() {
    // Handler fonksiyonlarını this bağlamıyla bağlayalım
    this.handlePlaylist = this.handlePlaylist.bind(this);
    this.handleCommand = this.handleCommand.bind(this);

    // Şimdi Map'e ekleyelim
    this.handlers.set('playlist', this.handlePlaylist);
    this.handlers.set('command', this.handleCommand);
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

    // Playlist bilgisini renderer'a gönder
    mainWindow.webContents.send('playlist-info', {
      id: playlist._id,
      name: playlist.name,
      artwork: playlist.artwork
    });

    // Her şarkıyı indir
    for (const song of playlist.songs) {
      try {
        console.log('Processing song:', song);
        const songUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
        const filename = `${song._id}${path.extname(song.filePath)}`;

        mainWindow.webContents.send('download-progress', {
          songName: song.name,
          progress: 0
        });

        const localPath = await downloadFile(songUrl, filename, (progress) => {
          mainWindow.webContents.send('download-progress', {
            songName: song.name,
            progress
          });
        });

        // İndirilen şarkı bilgisini renderer'a gönder
        mainWindow.webContents.send('song-downloaded', {
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
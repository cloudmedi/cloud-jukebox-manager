const { BrowserWindow } = require('electron');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');

class WebSocketMessageHandler {
  constructor() {
    this.store = new Store();
    this.handlers = new Map();
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.handlers.set('playlist', this.handlePlaylist.bind(this));
    this.handlers.set('command', this.handleCommand.bind(this));
    this.handlers.set('songRemoved', this.handleSongRemoved.bind(this));
  }

  async handleMessage(message) {
    console.log('WebSocket mesajı alındı:', message);
    const handler = this.handlers.get(message.type);
    
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        console.error('Mesaj işleme hatası:', error);
        this.sendToRenderer('error', {
          type: 'error',
          message: error.message
        });
      }
    } else {
      console.warn('Bilinmeyen mesaj tipi:', message.type);
    }
  }

  async handlePlaylist(message) {
    console.log('Playlist mesajı işleniyor:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    if (message.action === 'deleted') {
      console.log('Playlist silme mesajı alındı:', message.playlistId);
      
      const playlists = this.store.get('playlists', []);
      const playlistIndex = playlists.findIndex(p => p._id === message.playlistId);
      
      if (playlistIndex !== -1) {
        const playlist = playlists[playlistIndex];
        console.log('Silinecek playlist bulundu:', playlist.name);
        
        playlists.splice(playlistIndex, 1);
        this.store.set('playlists', playlists);
        
        if (playlist.songs) {
          playlist.songs.forEach(song => {
            if (song.localPath) {
              try {
                fs.unlinkSync(song.localPath);
                console.log('Şarkı dosyası silindi:', song.localPath);
              } catch (error) {
                console.error('Şarkı dosyası silinirken hata:', error);
              }
            }
          });
        }
        
        mainWindow.webContents.send('playlist-deleted', {
          playlistId: message.playlistId
        });
        
        console.log('Playlist başarıyla silindi ve temizlendi');
      } else {
        console.log('Silinecek playlist bulunamadı:', message.playlistId);
      }
    } else if (message.action === 'update') {
      console.log('Playlist güncelleme mesajı alındı');
      const playlists = this.store.get('playlists', []);
      const playlistIndex = playlists.findIndex(p => p._id === message.playlist._id);
      
      if (playlistIndex !== -1) {
        playlists[playlistIndex] = message.playlist;
        this.store.set('playlists', playlists);
        mainWindow.webContents.send('playlist-updated', message.playlist);
      }
    } else if (message.action === 'send') {
      console.log('Playlist gönderme mesajı alındı');
      const playlist = message.data;
      if (!playlist || !playlist.songs) {
        console.error('Geçersiz playlist verisi:', playlist);
        return;
      }

      const userDataPath = require('electron').app.getPath('userData');
      const playlistDir = path.join(userDataPath, 'downloads', playlist._id);

      if (!fs.existsSync(playlistDir)) {
        fs.mkdirSync(playlistDir, { recursive: true });
      }

      const storedPlaylist = {
        _id: playlist._id,
        name: playlist.name,
        artwork: playlist.artwork,
        songs: []
      };

      for (const song of playlist.songs) {
        try {
          const songUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
          const filename = `${song._id}${path.extname(song.filePath)}`;
          const localPath = path.join(playlistDir, filename);

          mainWindow.webContents.send('download-progress', {
            songName: song.name,
            progress: 0
          });

          await this.downloadFile(songUrl, localPath, (progress) => {
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
          console.error(`Şarkı indirme hatası ${song.name}:`, error);
          mainWindow.webContents.send('download-error', {
            songName: song.name,
            error: error.message
          });
        }
      }

      mainWindow.webContents.send('playlist-received', storedPlaylist);
    }
  }

  async downloadFile(url, filePath, onProgress) {
    const axios = require('axios');
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    const totalLength = response.headers['content-length'];

    return new Promise((resolve, reject) => {
      let downloaded = 0;

      response.data.on('data', (chunk) => {
        downloaded += chunk.length;
        const progress = Math.round((downloaded * 100) / totalLength);
        onProgress(progress);
      });

      writer.on('finish', resolve);
      writer.on('error', reject);
      response.data.pipe(writer);
    });
  }

  handleCommand(message) {
    console.log('Command message received:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    switch (message.command) {
      case 'restart':
        require('electron').app.relaunch();
        require('electron').app.exit(0);
        break;
      default:
        mainWindow.webContents.send(message.command, message.data);
        break;
    }
  }

  handleSongRemoved(message) {
    console.log('Song removal message received:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    const { songId, playlistId } = message;
    mainWindow.webContents.send('songRemoved', { songId, playlistId });
  }

  sendToRenderer(channel, data) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send(channel, data);
    }
  }
}

module.exports = new WebSocketMessageHandler();

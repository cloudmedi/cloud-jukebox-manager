const { BrowserWindow, app } = require('electron');
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
    this.handlers.set('songRemoved', this.handleSongRemoved.bind(this));
  }

  async handleMessage(message) {
    console.log('İşlenen mesaj:', message);
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
      console.warn('İşleyici bulunamadı:', message.type);
    }
  }

  async handlePlaylist(message) {
    console.log('Playlist mesajı alındı:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    // Playlist silme işlemi
    if (message.action === 'deleted') {
      console.log('Playlist silme mesajı alındı:', message.playlistId);
      
      // Store'dan playlistleri al
      const playlists = this.store.get('playlists', []);
      
      // Silinen playlist'i bul
      const playlistIndex = playlists.findIndex(p => p._id === message.playlistId);
      
      if (playlistIndex !== -1) {
        console.log('Playlist bulundu ve siliniyor:', playlists[playlistIndex].name);
        
        // Playlist'i store'dan kaldır
        playlists.splice(playlistIndex, 1);
        this.store.set('playlists', playlists);
        
        // Renderer'a bildir
        mainWindow.webContents.send('playlist-deleted', message.playlistId);
        
        console.log('Playlist başarıyla silindi');
      }
      return;
    }

    // Normal playlist işleme
    const playlist = message.data;
    if (!playlist || !playlist.songs) {
      console.error('Geçersiz playlist verisi:', playlist);
      return;
    }

    console.log('Playlist işleniyor:', playlist.name);

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

    // Her şarkıyı indir
    for (const song of playlist.songs) {
      try {
        console.log('Şarkı işleniyor:', song.name);
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
        console.error(`Şarkı indirme hatası (${song.name}):`, error);
        mainWindow.webContents.send('download-error', {
          songName: song.name,
          error: error.message
        });
      }
    }

    console.log('Playlist kaydediliyor:', storedPlaylist);
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
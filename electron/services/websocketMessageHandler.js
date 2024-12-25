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
    console.log('Processing message:', message);
    
    if (message.type === 'playlist' && message.action === 'songRemoved') {
      await this.handleSongRemoved(message.data);
      return;
    }
    
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

  async handleSongRemoved(data) {
    try {
      console.log('Handling song removal:', data);
      const { songId, playlistId } = data;
      
      // Store'dan playlistleri al
      const playlists = this.store.get('playlists', []);
      const playlistIndex = playlists.findIndex(p => p._id === playlistId);
      
      if (playlistIndex !== -1) {
        const playlist = playlists[playlistIndex];
        console.log('Found playlist:', playlist.name);
        
        // Silinecek şarkıyı bul
        const songToRemove = playlist.songs.find(song => song._id === songId);
        
        if (songToRemove && songToRemove.localPath) {
          // Dosya sisteminden şarkıyı sil
          try {
            if (fs.existsSync(songToRemove.localPath)) {
              fs.unlinkSync(songToRemove.localPath);
              console.log('Successfully deleted local file:', songToRemove.localPath);
            } else {
              console.log('Local file not found:', songToRemove.localPath);
            }
          } catch (error) {
            console.error('Error deleting local file:', error);
          }
        }

        // Playlistten şarkıyı kaldır
        playlist.songs = playlist.songs.filter(song => song._id !== songId);
        
        // Store'u güncelle
        playlists[playlistIndex] = playlist;
        this.store.set('playlists', playlists);
        console.log('Updated playlists in store');
        
        // Renderer'a bildir
        const mainWindow = BrowserWindow.getAllWindows()[0];
        if (mainWindow) {
          mainWindow.webContents.send('songRemoved', {
            songId,
            playlistId
          });
        }
      } else {
        console.log('Playlist not found:', playlistId);
      }
    } catch (error) {
      console.error('Error handling song removal:', error);
    }
  }

  handleCommand(message) {
    console.log('Handling command:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];

    switch (message.command) {
      case 'restart':
        console.log('Restarting application...');
        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 1000);
        break;
        
      default:
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
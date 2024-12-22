const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

class PlaylistService {
  constructor(ws) {
    this.ws = ws;
    this.downloadQueue = new Map();
    this.setupMessageHandlers();
  }

  setupMessageHandlers() {
    this.ws.on('message', async (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'playlist') {
        console.log('Yeni playlist alındı:', message.playlist.name);
        await this.handleNewPlaylist(message.playlist);
      }
    });
  }

  async handleNewPlaylist(playlist) {
    try {
      // Playlist'i locale kaydet
      const playlistPath = path.join(process.env.APPDATA || process.env.HOME, 'cloud-media-player', 'playlists');
      if (!fs.existsSync(playlistPath)) {
        fs.mkdirSync(playlistPath, { recursive: true });
      }

      // Şarkıları indir
      for (const song of playlist.songs) {
        await this.downloadSong(song, playlistPath);
      }

      // İndirme tamamlandı, çalmaya başla
      this.ws.send(JSON.stringify({
        type: 'playlistReady',
        playlistId: playlist._id
      }));

      // Ana pencereye playlist hazır bilgisi gönder
      if (global.mainWindow) {
        global.mainWindow.webContents.send('startPlaylist', playlist);
      }
    } catch (error) {
      console.error('Playlist indirme hatası:', error);
      this.ws.send(JSON.stringify({
        type: 'error',
        error: 'Playlist indirilemedi'
      }));
    }
  }

  async downloadSong(song, playlistPath) {
    const songPath = path.join(playlistPath, `${song._id}.mp3`);
    
    // Şarkı zaten indirilmişse tekrar indirme
    if (fs.existsSync(songPath)) {
      return;
    }

    try {
      const response = await axios({
        method: 'get',
        url: `http://localhost:5000${song.filePath}`,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(songPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      console.error(`Şarkı indirme hatası (${song.name}):`, error);
      throw error;
    }
  }
}

module.exports = PlaylistService;
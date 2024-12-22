const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { app } = require('electron');

class PlaylistService {
  constructor(ws) {
    this.ws = ws;
    this.downloadQueue = new Map();
    this.setupMessageHandlers();
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    
    // İndirme klasörünü oluştur
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  setupMessageHandlers() {
    this.ws.on('message', async (data) => {
      const message = JSON.parse(data);
      
      if (message.type === 'playlist') {
        console.log('Yeni playlist alındı:', message.data.name);
        await this.handleNewPlaylist(message.data);
      }
    });
  }

  async handleNewPlaylist(playlist) {
    try {
      // Playlist için klasör oluştur
      const playlistPath = path.join(this.downloadPath, playlist._id);
      if (!fs.existsSync(playlistPath)) {
        fs.mkdirSync(playlistPath, { recursive: true });
      }

      // Artwork'ü indir
      if (playlist.artwork) {
        await this.downloadArtwork(playlist.artwork, playlistPath);
        this.sendProgress('artwork', 100);
      }

      // Şarkıları sırayla indir
      for (let i = 0; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        await this.downloadSong(song, playlistPath, playlist.baseUrl);
        
        // İlerleme durumunu gönder
        const progress = Math.round(((i + 1) / playlist.songs.length) * 100);
        this.sendProgress('songs', progress);
      }

      // İndirme tamamlandı, çalmaya başla
      this.ws.send(JSON.stringify({
        type: 'playlistReady',
        playlistId: playlist._id
      }));

      // Ana pencereye playlist hazır bilgisi gönder
      if (global.mainWindow) {
        global.mainWindow.webContents.send('startPlaylist', {
          ...playlist,
          localPath: playlistPath
        });
      }
    } catch (error) {
      console.error('Playlist indirme hatası:', error);
      this.ws.send(JSON.stringify({
        type: 'error',
        error: 'Playlist indirilemedi: ' + error.message
      }));
    }
  }

  async downloadArtwork(artworkUrl, playlistPath) {
    const artworkPath = path.join(playlistPath, 'artwork.jpg');
    await this.downloadFile(artworkUrl, artworkPath);
  }

  async downloadSong(song, playlistPath, baseUrl) {
    const songPath = path.join(playlistPath, `${song._id}.mp3`);
    
    // Şarkı zaten indirilmişse tekrar indirme
    if (fs.existsSync(songPath)) {
      return;
    }

    const songUrl = `${baseUrl}${song.filePath}`;
    await this.downloadFile(songUrl, songPath);
  }

  async downloadFile(url, filePath) {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  sendProgress(type, progress) {
    this.ws.send(JSON.stringify({
      type: 'downloadProgress',
      downloadType: type,
      progress: progress
    }));
  }
}

module.exports = PlaylistService;
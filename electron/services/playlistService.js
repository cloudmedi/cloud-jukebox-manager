const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const websocketService = require('./websocketService');

class PlaylistService {
  constructor() {
    this.store = new Store();
    this.initializeDownloadPath();
  }

  initializeDownloadPath() {
    try {
      this.downloadPath = path.join(process.env.APPDATA || process.env.HOME, 'cloud-media-player', 'playlists');
      console.log('Download path:', this.downloadPath);
      this.ensureDirectoryExists(this.downloadPath);
    } catch (error) {
      console.error('Download path initialization error:', error);
    }
  }

  ensureDirectoryExists(dir) {
    try {
      if (!fs.existsSync(dir)) {
        console.log('Creating directory:', dir);
        fs.mkdirSync(dir, { recursive: true });
        console.log('Directory created successfully');
      }
    } catch (error) {
      console.error('Directory creation error:', error);
      throw error;
    }
  }

  async handlePlaylistMessage(message) {
    console.log('Playlist mesajı alındı:', message);
    
    if (!message || !message.data) {
      console.error('Geçersiz playlist mesajı:', message);
      websocketService.updatePlaylistStatus('error', message.data?._id);
      return;
    }
    
    const playlist = message.data;
    console.log('Playlist mesajı işleniyor:', playlist);
    
    try {
      const playlistPath = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistPath);
      
      console.log('Playlist indirme başlatılıyor:', playlist._id);
      websocketService.updatePlaylistStatus('loading', playlist._id);
      
      for (let i = 0; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        console.log(`Şarkı indiriliyor (${i + 1}/${playlist.songs.length}):`, song.name);
        
        try {
          const songPath = path.join(playlistPath, `${song._id}.mp3`);
          const fullUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
          
          await this.downloadFile(fullUrl, songPath);
          playlist.songs[i] = {
            ...song,
            localPath: songPath
          };
          
        } catch (error) {
          console.error(`Şarkı indirme hatası (${song.name}):`, error);
          websocketService.updatePlaylistStatus('error', playlist._id);
          return;
        }
      }

      // Tüm şarkılar başarıyla indirildi
      websocketService.updatePlaylistStatus('loaded', playlist._id);
      console.log('Playlist başarıyla indirildi:', playlist._id);

      return true;
    } catch (error) {
      console.error('Playlist indirme hatası:', error);
      websocketService.updatePlaylistStatus('error', playlist._id);
      throw error;
    }
  }

  async downloadFile(url, filePath) {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('Dosya indirme tamamlandı:', filePath);
        resolve();
      });
      writer.on('error', (err) => {
        console.error('Dosya indirme hatası:', err);
        reject(err);
      });
    });
  }
}

module.exports = new PlaylistService();
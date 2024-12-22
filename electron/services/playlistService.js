const { app } = require('electron');
const path = require('path');
const Store = require('electron-store');
const axios = require('axios');
const fs = require('fs');

class PlaylistService {
  constructor() {
    this.store = new Store();
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    this.ensureDirectoryExists(this.downloadPath);
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async handlePlaylistMessage(message, ws) {
    console.log('Playlist mesajı alındı:', message);
    
    if (!message || !message.data) {
      console.error('Geçersiz playlist mesajı:', message);
      return;
    }
    
    const playlist = message.data;
    console.log('Playlist mesajı işleniyor:', playlist);
    
    try {
      const playlistPath = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistPath);
      
      console.log('Playlist indirme başlatılıyor:', playlist._id);
      
      // İndirme durumunu kaydet
      this.store.set(`download.${playlist._id}`, {
        status: 'downloading',
        progress: 0,
        completedSongs: []
      });

      // Şarkıları sırayla indir
      for (let i = 0; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        console.log(`Şarkı indiriliyor (${i + 1}/${playlist.songs.length}):`, song.name);
        
        const songPath = path.join(playlistPath, `${song._id}.mp3`);
        const fullUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
        
        try {
          await this.downloadFile(fullUrl, songPath, (progress) => {
            if (ws) {
              ws.send(JSON.stringify({
                type: 'downloadProgress',
                songId: song._id,
                progress
              }));
            }
          });
          
          // Başarılı indirmeleri kaydet
          const downloadState = this.store.get(`download.${playlist._id}`);
          downloadState.completedSongs.push(song._id);
          this.store.set(`download.${playlist._id}`, downloadState);
        } catch (error) {
          console.error(`Şarkı indirme hatası (${song.name}):`, error);
          if (ws) {
            ws.send(JSON.stringify({
              type: 'error',
              songId: song._id,
              error: error.message
            }));
          }
        }

        // İlerleme durumunu gönder
        if (ws) {
          ws.send(JSON.stringify({
            type: 'downloadProgress',
            playlistId: playlist._id,
            progress: Math.round(((i + 1) / playlist.songs.length) * 100)
          }));
        }
      }

      // İndirme durumunu güncelle
      this.store.set(`download.${playlist._id}`, {
        status: 'completed',
        progress: 100,
        completedSongs: playlist.songs.map(s => s._id)
      });

      if (ws) {
        ws.send(JSON.stringify({
          type: 'playlistReady',
          playlistId: playlist._id
        }));
      }

      return true;
    } catch (error) {
      console.error('Playlist indirme hatası:', error);
      if (ws) {
        ws.send(JSON.stringify({
          type: 'error',
          error: error.message
        }));
      }
      throw error;
    }
  }

  async downloadFile(url, filePath, onProgress) {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);
    const totalLength = response.headers['content-length'];

    response.data.pipe(writer);

    if (onProgress && totalLength) {
      let downloaded = 0;
      response.data.on('data', (chunk) => {
        downloaded += chunk.length;
        const progress = Math.round((downloaded * 100) / totalLength);
        onProgress(progress);
      });
    }

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
}

module.exports = new PlaylistService();
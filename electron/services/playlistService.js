const QueueManager = require('./audio/QueueManager');
const PlaybackState = require('./audio/PlaybackState');
const path = require('path');
const Store = require('electron-store');
const audioPlayer = require('./audioPlayer');

class PlaylistService {
  constructor() {
    this.store = new Store();
    this.initializeDownloadPath();
  }

  initializeDownloadPath() {
    try {
      this.downloadPath = path.join(app.getPath('userData'), 'downloads');
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
      } else {
        console.log('Directory already exists:', dir);
      }
    } catch (error) {
      console.error('Directory creation error:', error);
      throw error;
    }
  }

  async handlePlaylistMessage(message, ws) {
    console.log('Playlist mesajı alındı:', message);
    
    if (!message || !message.data) {
      console.error('Geçersiz playlist mesajı:', message);
      if (ws) {
        ws.send(JSON.stringify({
          type: 'downloadProgress',
          error: 'Geçersiz playlist mesajı',
        }));
      }
      return;
    }
    
    const playlist = message.data;
    console.log('Playlist mesajı işleniyor:', playlist);
    
    try {
      const playlistPath = path.join(this.downloadPath, playlist._id);
      console.log('Playlist klasör yolu:', playlistPath);
      this.ensureDirectoryExists(playlistPath);
      
      console.log('Playlist indirme başlatılıyor:', playlist._id);
      
      this.store.set(`download.${playlist._id}`, {
        status: 'downloading',
        progress: 0,
        completedSongs: []
      });

      for (let i = 0; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        console.log(`Şarkı indiriliyor (${i + 1}/${playlist.songs.length}):`, song.name);
        
        try {
          const songPath = path.join(playlistPath, `${song._id}.mp3`);
          const fullUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
          
          await this.downloadFile(fullUrl, songPath, (progress) => {
            if (ws) {
              ws.send(JSON.stringify({
                type: 'downloadProgress',
                songId: song._id,
                songName: song.name,
                progress,
              }));
            }
          });
          
          playlist.songs[i] = {
            ...song,
            localPath: songPath
          };
          
          const downloadState = this.store.get(`download.${playlist._id}`);
          downloadState.completedSongs.push(song._id);
          this.store.set(`download.${playlist._id}`, downloadState);
          
        } catch (error) {
          console.error(`Şarkı indirme hatası (${song.name}):`, error);
          if (ws) {
            ws.send(JSON.stringify({
              type: 'downloadProgress',
              songId: song._id,
              songName: song.name,
              error: `İndirme hatası: ${error.message}`
            }));
          }
          
          // İndirme hatası durumunda sunucuya bildir
          ws.send(JSON.stringify({
            type: 'playlistStatus',
            status: 'error',
            playlistId: playlist._id
          }));
          return;
        }
      }

      // Tüm şarkılar başarıyla indirildi
      this.store.set(`download.${playlist._id}`, {
        status: 'completed',
        progress: 100,
        completedSongs: playlist.songs.map(s => s._id)
      });

      // Sunucuya yükleme tamamlandı bilgisi gönder
      ws.send(JSON.stringify({
        type: 'playlistStatus',
        status: 'loaded',
        playlistId: playlist._id
      }));

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
          type: 'downloadProgress',
          error: `Playlist indirme hatası: ${error.message}`
        }));
        
        // Genel hata durumunda sunucuya bildir
        ws.send(JSON.stringify({
          type: 'playlistStatus',
          status: 'error',
          playlistId: playlist._id
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

    console.log('Dosya indirme başladı:', filePath);
    console.log('Toplam boyut:', totalLength);

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
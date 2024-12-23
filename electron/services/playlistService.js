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
      return;
    }
    
    const playlist = message.data;
    console.log('Playlist mesajı işleniyor:', playlist);
    
    try {
      const playlistPath = path.join(this.downloadPath, playlist._id);
      console.log('Playlist klasör yolu:', playlistPath);
      this.ensureDirectoryExists(playlistPath);
      
      console.log('Playlist indirme başlatılıyor:', playlist._id);
      
      // İndirme durumunu kaydet
      this.store.set(`download.${playlist._id}`, {
        status: 'downloading',
        progress: 0,
        completedSongs: []
      });

      // Şarkıları sırayla indir ve localPath'leri güncelle
      for (let i = 0; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        console.log(`Şarkı indiriliyor (${i + 1}/${playlist.songs.length}):`, song.name);
        
        const songPath = path.join(playlistPath, `${song._id}.mp3`);
        const fullUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
        
        console.log('Şarkı indirme yolu:', songPath);
        console.log('Şarkı indirme URL:', fullUrl);
        
        try {
          await this.downloadFile(fullUrl, songPath, (progress) => {
            // İndirme ilerlemesini renderer'a gönder
            if (ws) {
              ws.send(JSON.stringify({
                type: 'downloadProgress',
                songId: song._id,
                progress,
                songName: song.name
              }));
            }
          });
          
          // Başarılı indirmeleri kaydet
          const downloadState = this.store.get(`download.${playlist._id}`);
          downloadState.completedSongs.push(song._id);
          this.store.set(`download.${playlist._id}`, downloadState);

          // Şarkının localPath'ini güncelle
          playlist.songs[i] = {
            ...song,
            localPath: songPath
          };
          
          console.log(`Şarkı başarıyla indirildi: ${song.name}, Local path: ${songPath}`);
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

        // Toplam ilerleme durumunu gönder
        if (ws) {
          ws.send(JSON.stringify({
            type: 'downloadProgress',
            playlistId: playlist._id,
            progress: Math.round(((i + 1) / playlist.songs.length) * 100),
            songName: song.name
          }));
        }
      }

      // İndirme durumunu güncelle
      this.store.set(`download.${playlist._id}`, {
        status: 'completed',
        progress: 100,
        completedSongs: playlist.songs.map(s => s._id)
      });

      console.log('Playlist indirme tamamlandı:', playlist._id);
      console.log('Güncellenmiş playlist:', playlist);

      // Playlist'i AudioPlayer'a yükle ve çalmaya başla
      audioPlayer.loadPlaylist(playlist);
      audioPlayer.play();

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

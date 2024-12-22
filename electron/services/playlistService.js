const { app } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { ensureDirectoryExists, createFullUrl, downloadFile } = require('./downloadUtils');

class PlaylistService {
  constructor() {
    this.store = new Store();
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    ensureDirectoryExists(this.downloadPath);
  }

  async downloadSong(song, playlistPath, baseUrl, ws) {
    const songPath = path.join(playlistPath, `${song._id}.mp3`);
    
    try {
      const fullUrl = createFullUrl(baseUrl, song.filePath);
      console.log('Downloading song from URL:', fullUrl);
      
      await downloadFile(fullUrl, songPath, (progress) => {
        if (ws) {
          ws.send(JSON.stringify({
            type: 'downloadProgress',
            songId: song._id,
            progress
          }));
        }
      });
      
      this.store.set(`download.${song._id}`, {
        status: 'completed',
        path: songPath
      });

      return { success: true, path: songPath };
    } catch (error) {
      console.error(`Şarkı indirme hatası (${song.name}):`, error);
      this.store.set(`download.${song._id}`, {
        status: 'error',
        error: error.message
      });

      if (ws) {
        ws.send(JSON.stringify({
          type: 'error',
          songId: song._id,
          error: error.message
        }));
      }

      return { success: false, error: error.message };
    }
  }

  async handlePlaylistMessage(message, ws) {
    console.log('Playlist mesajı alındı:', message);
    
    try {
      const playlist = message.data;
      console.log('Playlist mesajı işleniyor:', playlist);
      
      const playlistPath = path.join(this.downloadPath, playlist._id);
      ensureDirectoryExists(playlistPath);
      
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
        
        const result = await this.downloadSong(song, playlistPath, playlist.baseUrl, ws);
        
        if (result.success) {
          // Başarılı indirmeleri kaydet
          const downloadState = this.store.get(`download.${playlist._id}`);
          downloadState.completedSongs.push(song._id);
          this.store.set(`download.${playlist._id}`, downloadState);
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
}

module.exports = new PlaylistService();
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Store = require('electron-store');
const audioPlayer = require('./audioPlayer');

class PlaylistService {
  constructor() {
    this.store = new Store();
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    this.currentDownloads = new Map();
    this.ensureDirectories();
  }

  ensureDirectories() {
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }
  }

  checkDiskSpace() {
    const stats = fs.statfsSync(this.downloadPath);
    const freeSpace = stats.bfree * stats.bsize;
    return freeSpace > 1024 * 1024 * 100; // Minimum 100MB gerekli
  }

  async handlePlaylistMessage(message, ws) {
    try {
      if (!this.checkDiskSpace()) {
        throw new Error('Yetersiz disk alanı');
      }

      const { playlist } = message;
      const playlistPath = path.join(this.downloadPath, playlist._id);
      
      // İndirme durumunu kaydet
      this.store.set(`download.${playlist._id}`, {
        status: 'downloading',
        progress: 0,
        completedSongs: []
      });

      // Artwork indir
      if (playlist.artwork) {
        await this.downloadArtwork(playlist.artwork, playlistPath);
        this.sendProgress(ws, 'artwork', 100);
      }

      // Şarkıları sırayla indir
      for (let i = 0; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        const songStatus = await this.downloadSong(song, playlistPath, ws);
        
        if (songStatus.success) {
          // Başarılı indirmeleri kaydet
          const downloadState = this.store.get(`download.${playlist._id}`);
          downloadState.completedSongs.push(song._id);
          this.store.set(`download.${playlist._id}`, downloadState);
        }

        // Toplam ilerlemeyi hesapla ve gönder
        const totalProgress = Math.round(((i + 1) / playlist.songs.length) * 100);
        this.sendProgress(ws, 'total', totalProgress);
      }

      // Playlist'i local veritabanına kaydet
      this.savePlaylistToDb(playlist, playlistPath);

      // İndirme durumunu güncelle
      this.store.set(`download.${playlist._id}`, {
        status: 'completed',
        progress: 100,
        completedSongs: playlist.songs.map(s => s._id)
      });

      // Çalmaya başla
      audioPlayer.loadPlaylist(playlist);
      audioPlayer.play();

      ws.send(JSON.stringify({
        type: 'playlistReady',
        playlistId: playlist._id
      }));

    } catch (error) {
      console.error('Playlist indirme hatası:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  }

  async downloadArtwork(artworkUrl, playlistPath) {
    const artworkPath = path.join(playlistPath, 'artwork.jpg');
    
    // Eğer dosya zaten varsa tekrar indirme
    if (fs.existsSync(artworkPath)) {
      return artworkPath;
    }

    await this.downloadFile(artworkUrl, artworkPath);
    return artworkPath;
  }

  async downloadSong(song, playlistPath, ws) {
    const songPath = path.join(playlistPath, `${song._id}.mp3`);
    
    // Yarım kalan indirmeyi kontrol et
    const downloadState = this.store.get(`download.${song._id}`);
    if (downloadState && downloadState.status === 'completed') {
      return { success: true, path: songPath };
    }

    try {
      await this.downloadFile(song.filePath, songPath, (progress) => {
        this.sendProgress(ws, 'song', progress, song._id);
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

      ws.send(JSON.stringify({
        type: 'songError',
        songId: song._id,
        error: error.message
      }));

      return { success: false, error: error.message };
    }
  }

  async downloadFile(url, filePath, onProgress) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      onDownloadProgress: (progressEvent) => {
        if (onProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      }
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  sendProgress(ws, type, progress, songId = null) {
    ws.send(JSON.stringify({
      type: 'downloadProgress',
      downloadType: type,
      progress,
      songId
    }));
  }

  savePlaylistToDb(playlist, playlistPath) {
    const playlistData = {
      _id: playlist._id,
      name: playlist.name,
      artwork: path.join(playlistPath, 'artwork.jpg'),
      songs: playlist.songs.map(song => ({
        ...song,
        localPath: path.join(playlistPath, `${song._id}.mp3`)
      })),
      createdAt: new Date().toISOString()
    };

    this.store.set(`playlists.${playlist._id}`, playlistData);
  }

  resumeIncompleteDownloads(ws) {
    const downloads = this.store.get('download');
    if (!downloads) return;

    Object.entries(downloads).forEach(([playlistId, download]) => {
      if (download.status === 'downloading') {
        // Yarım kalan indirmeyi devam ettir
        const playlist = this.store.get(`playlists.${playlistId}`);
        if (playlist) {
          this.handlePlaylistMessage({ playlist }, ws);
        }
      }
    });
  }
}

module.exports = new PlaylistService();
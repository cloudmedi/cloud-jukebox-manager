const { ipcMain } = require('electron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

class AsyncDownloadManager {
  constructor() {
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = 3;
    this.setupListeners();
  }

  setupListeners() {
    ipcMain.handle('start-playlist-download', async (event, playlist) => {
      console.log('Starting playlist download:', playlist.name);
      return await this.handlePlaylistDownload(playlist);
    });
  }

  async handlePlaylistDownload(playlist) {
    try {
      const playlistDir = path.join(store.get('downloadPath'), playlist._id);
      if (!fs.existsSync(playlistDir)) {
        fs.mkdirSync(playlistDir, { recursive: true });
      }

      // İlk şarkıyı yüksek öncelikle indir
      const firstSong = playlist.songs[0];
      if (firstSong) {
        await this.downloadSongWithPriority(firstSong, playlist.baseUrl, playlistDir, 'high');
      }

      // Diğer şarkıları kuyruğa ekle
      playlist.songs.slice(1).forEach(song => {
        this.queueSongDownload(song, playlist.baseUrl, playlistDir);
      });

      return true;
    } catch (error) {
      console.error('Playlist download error:', error);
      throw error;
    }
  }

  async downloadSongWithPriority(song, baseUrl, playlistDir, priority = 'normal') {
    try {
      console.log(`Downloading song with ${priority} priority:`, song.name);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      const response = await axios({
        url: songUrl,
        method: 'GET',
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(songPath);
      
      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        
        writer.on('finish', () => {
          console.log('Song download completed:', song.name);
          song.localPath = songPath;
          resolve(song);
        });

        writer.on('error', (error) => {
          console.error('Song download error:', error);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  queueSongDownload(song, baseUrl, playlistDir) {
    this.downloadQueue.push({
      song,
      baseUrl,
      playlistDir
    });
    this.processQueue();
  }

  async processQueue() {
    if (this.activeDownloads.size >= this.maxConcurrentDownloads) {
      return;
    }

    while (
      this.downloadQueue.length > 0 && 
      this.activeDownloads.size < this.maxConcurrentDownloads
    ) {
      const download = this.downloadQueue.shift();
      if (download) {
        this.activeDownloads.set(download.song._id, download);
        
        try {
          await this.downloadSongWithPriority(
            download.song,
            download.baseUrl,
            download.playlistDir
          );
        } finally {
          this.activeDownloads.delete(download.song._id);
          this.processQueue();
        }
      }
    }
  }
}

module.exports = new AsyncDownloadManager();
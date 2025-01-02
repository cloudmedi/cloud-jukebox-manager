const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Store = require('electron-store');
const store = new Store();

class ChunkDownloadManager {
  constructor() {
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = 3;
    this.isProcessing = false;
    
    // Temel indirme dizinini ayarla
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    this.ensureDirectoryExists(this.downloadPath);
  }

  ensureDirectoryExists(dirPath) {
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    } catch (error) {
      console.error(`Directory creation error for path ${dirPath}:`, error);
      throw error;
    }
  }

  async downloadSong(song, baseUrl, playlistId) {
    try {
      console.log(`Starting download for song: ${song.name}`);
      
      // Playlist için dizin oluştur
      const playlistDir = path.join(this.downloadPath, playlistId);
      this.ensureDirectoryExists(playlistDir);
      
      // Şarkı dosya yolunu oluştur
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      // Şarkı zaten var mı kontrol et
      if (fs.existsSync(songPath)) {
        console.log(`Song already exists: ${song.name}`);
        return songPath;
      }

      const response = await axios({
        url: songUrl,
        method: 'GET',
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(songPath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`Download completed: ${song.name}`);
          resolve(songPath);
        });
        
        writer.on('error', (error) => {
          console.error(`Error downloading song ${song.name}:`, error);
          reject(error);
        });
      });

    } catch (error) {
      console.error(`Error downloading song ${song.name}:`, error);
      throw error;
    }
  }

  queueSongDownload(song, baseUrl, playlistId) {
    console.log(`Adding song to queue: ${song.name}`);
    this.downloadQueue.push({ song, baseUrl, playlistId });
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.activeDownloads.size >= this.maxConcurrentDownloads) {
      return;
    }

    this.isProcessing = true;

    try {
      while (
        this.downloadQueue.length > 0 && 
        this.activeDownloads.size < this.maxConcurrentDownloads
      ) {
        const download = this.downloadQueue.shift();
        if (download) {
          const { song, baseUrl, playlistId } = download;
          this.activeDownloads.set(song._id, download);
          
          try {
            const songPath = await this.downloadSong(song, baseUrl, playlistId);
            song.localPath = songPath;
            this.emit('songDownloaded', song._id);
          } finally {
            this.activeDownloads.delete(song._id);
          }
        }
      }
    } finally {
      this.isProcessing = false;
      
      if (this.downloadQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  calculateChunkSize(fileSize) {
    if (fileSize < 10 * 1024 * 1024) return 256 * 1024; // 256KB
    if (fileSize < 100 * 1024 * 1024) return 1024 * 1024; // 1MB
    return 2 * 1024 * 1024; // 2MB
  }
}

module.exports = new ChunkDownloadManager();
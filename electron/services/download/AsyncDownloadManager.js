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
    this.maxRetries = 3;
    this.retryDelays = [2000, 4000, 8000]; // Exponential backoff
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
        await this.downloadSongWithRetry(firstSong, playlist.baseUrl, playlistDir, 'high');
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

  async downloadSongWithRetry(song, baseUrl, playlistDir, priority = 'normal', retryCount = 0) {
    try {
      console.log(`Downloading song with ${priority} priority:`, song.name);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      const response = await axios({
        url: songUrl,
        method: 'GET',
        responseType: 'stream',
        timeout: 30000 // 30 saniye timeout
      });

      const writer = fs.createWriteStream(songPath);
      
      return new Promise((resolve, reject) => {
        response.data.pipe(writer);
        
        writer.on('finish', () => {
          console.log('Song download completed:', song.name);
          song.localPath = songPath;
          resolve(song);
        });

        writer.on('error', async (error) => {
          console.error('Download error:', error);
          writer.close();

          if (retryCount < this.maxRetries) {
            console.log(`Retrying download (${retryCount + 1}/${this.maxRetries}):`, song.name);
            const delay = this.retryDelays[retryCount];
            await new Promise(resolve => setTimeout(resolve, delay));
            
            try {
              const result = await this.downloadSongWithRetry(
                song, 
                baseUrl, 
                playlistDir, 
                priority, 
                retryCount + 1
              );
              resolve(result);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            reject(new Error(`Failed to download after ${this.maxRetries} attempts: ${error.message}`));
          }
        });
      });
    } catch (error) {
      console.error(`Error in download attempt ${retryCount + 1}:`, error);
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelays[retryCount];
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.downloadSongWithRetry(song, baseUrl, playlistDir, priority, retryCount + 1);
      }
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
          await this.downloadSongWithRetry(
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
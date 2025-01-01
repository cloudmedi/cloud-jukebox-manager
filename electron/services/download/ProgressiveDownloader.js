const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { EventEmitter } = require('events');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('ProgressiveDownloader');

class ProgressiveDownloader extends EventEmitter {
  constructor() {
    super();
    this.downloadQueue = [];
    this.currentDownloads = new Map();
    this.priorityQueue = new Set();
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    
    if (!fs.existsSync(this.downloadPath)) {
      fs.mkdirSync(this.downloadPath, { recursive: true });
    }

    logger.info('ProgressiveDownloader initialized');
  }

  async startPlaylistDownload(playlist) {
    logger.info('Starting progressive download for playlist:', playlist.name);
    
    // İlk 3 şarkıyı öncelikli olarak indir
    const prioritySongs = playlist.songs.slice(0, 3);
    const remainingSongs = playlist.songs.slice(3);

    // İlk şarkıyı hemen indir ve hazır olduğunda event emit et
    if (prioritySongs.length > 0) {
      const firstSong = prioritySongs[0];
      try {
        const songPath = await this.downloadSong(firstSong, playlist.baseUrl);
        this.emit('firstSongReady', { ...firstSong, localPath: songPath });
        
        // Diğer öncelikli şarkıları indir
        for (const song of prioritySongs.slice(1)) {
          this.priorityQueue.add({ song, baseUrl: playlist.baseUrl });
        }
      } catch (error) {
        logger.error('Error downloading first song:', error);
        this.emit('error', { song: firstSong, error });
      }
    }

    // Kalan şarkıları kuyruğa ekle
    remainingSongs.forEach(song => {
      this.downloadQueue.push({ song, baseUrl: playlist.baseUrl });
    });

    this.processQueue();
  }

  async downloadSong(song, baseUrl) {
    const songPath = path.join(this.downloadPath, `${song._id}.mp3`);

    // Şarkı zaten indirilmişse, direkt döndür
    if (fs.existsSync(songPath)) {
      logger.info('Song already exists:', song.name);
      return songPath;
    }

    logger.info('Downloading song:', song.name);
    this.emit('downloadStart', song);

    try {
      const response = await axios({
        url: `${baseUrl}/${song.filePath}`,
        method: 'GET',
        responseType: 'stream',
        onDownloadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          this.emit('downloadProgress', { song, progress });
        }
      });

      const writer = fs.createWriteStream(songPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          logger.info('Song downloaded successfully:', song.name);
          this.emit('downloadComplete', { song, path: songPath });
          resolve(songPath);
        });
        writer.on('error', (error) => {
          logger.error('Error writing song:', error);
          this.emit('error', { song, error });
          reject(error);
        });
      });
    } catch (error) {
      logger.error('Error downloading song:', error);
      this.emit('error', { song, error });
      throw error;
    }
  }

  processQueue() {
    // Önce öncelikli kuyruktaki şarkıları işle
    for (const song of this.priorityQueue) {
      if (!this.currentDownloads.has(song._id)) {
        this.downloadSong(song.song, song.baseUrl);
      }
    }

    // Sonra normal kuyruğu işle
    while (this.downloadQueue.length > 0 && this.currentDownloads.size < 3) {
      const { song, baseUrl } = this.downloadQueue.shift();
      if (!this.currentDownloads.has(song._id)) {
        this.downloadSong(song, baseUrl);
      }
    }
  }

  cancelDownloads() {
    logger.info('Cancelling all downloads');
    this.downloadQueue = [];
    this.priorityQueue.clear();
    this.currentDownloads.clear();
    this.emit('downloadsCanceled');
  }
}

module.exports = new ProgressiveDownloader();
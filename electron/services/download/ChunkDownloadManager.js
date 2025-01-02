const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const RetryManager = require('./RetryManager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.retryManager = new RetryManager();
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.isProcessing = false;
  }

  async downloadSong(song, baseUrl, playlistDir) {
    try {
      console.log(`Starting download for song: ${song.name}`);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      const response = await axios({
        url: songUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 30000
      });

      fs.writeFileSync(songPath, Buffer.from(response.data));
      
      console.log(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      console.error(`Error downloading song ${song.name}:`, error);
      throw error;
    }
  }

  addToQueue(song, baseUrl, playlistDir) {
    console.log(`Adding song to queue: ${song.name}`);
    this.downloadQueue.push({ song, baseUrl, playlistDir });
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.downloadQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const { song, baseUrl, playlistDir } = this.downloadQueue[0];
      await this.downloadSong(song, baseUrl, playlistDir);
      this.downloadQueue.shift();
      
      this.emit('songDownloaded', song._id);
    } catch (error) {
      console.error('Error processing download queue:', error);
    } finally {
      this.isProcessing = false;
      if (this.downloadQueue.length > 0) {
        this.processQueue();
      }
    }
  }
}

module.exports = new ChunkDownloadManager();
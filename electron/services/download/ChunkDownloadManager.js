const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.downloadQueue = [];
    this.isDownloading = false;
  }

  async downloadSong(song, baseUrl, downloadDir) {
    try {
      console.log(`Starting download for song: ${song.name}`);
      const songPath = path.join(downloadDir, `${song._id}.mp3`);
      
      // Endpoint düzeltildi
      const response = await axios({
        method: 'get',
        url: `${baseUrl}/api/songs/${song._id}`,
        responseType: 'stream'
      });

      return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(songPath);
        
        response.data.pipe(writer);
        
        writer.on('finish', () => {
          console.log(`Download completed for song: ${song.name}`);
          this.emit('songDownloaded', song._id);
          resolve(songPath);
        });
        
        writer.on('error', (error) => {
          console.error(`Error downloading song ${song.name}:`, error);
          reject(error);
        });
      });
    } catch (error) {
      console.error(`Failed to download song ${song.name}:`, error);
      throw error;
    }
  }

  queueSongDownload(song, baseUrl, downloadDir) {
    this.downloadQueue.push({ song, baseUrl, downloadDir });
    this.processQueue();
  }

  async processQueue() {
    if (this.isDownloading || this.downloadQueue.length === 0) return;

    this.isDownloading = true;
    const { song, baseUrl, downloadDir } = this.downloadQueue.shift();

    try {
      await this.downloadSong(song, baseUrl, downloadDir);
    } catch (error) {
      console.error('Error processing download queue:', error);
    } finally {
      this.isDownloading = false;
      this.processQueue();
    }
  }
}

module.exports = ChunkDownloadManager;
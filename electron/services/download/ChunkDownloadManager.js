const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { storageService } = require('../storage/StorageService');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    this.activeDownloads = new Map();
    this.downloadQueue = [];
  }

  async downloadSongInChunks(song, baseUrl, playlistDir) {
    try {
      console.log(`Starting chunked download for song: ${song.name}`);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      // Get file size
      const response = await axios.head(songUrl);
      const fileSize = parseInt(response.headers['content-length'], 10);
      const totalChunks = Math.ceil(fileSize / this.CHUNK_SIZE);

      console.log(`File size: ${fileSize}, Total chunks: ${totalChunks}`);

      // Create write stream
      const writer = fs.createWriteStream(songPath);
      let downloadedChunks = 0;

      for (let i = 0; i < totalChunks; i++) {
        const start = i * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);

        try {
          const chunk = await this.downloadChunk(songUrl, start, end);
          writer.write(chunk);
          downloadedChunks++;

          // Emit progress
          const progress = Math.floor((downloadedChunks / totalChunks) * 100);
          this.emit('progress', {
            songId: song._id,
            progress,
            isFirstChunk: i === 0,
            isComplete: downloadedChunks === totalChunks
          });

          // If this is the first chunk, emit ready event
          if (i === 0) {
            this.emit('firstChunkReady', {
              songId: song._id,
              songPath
            });
          }
        } catch (error) {
          console.error(`Error downloading chunk ${i} for ${song.name}:`, error);
          throw error;
        }
      }

      writer.end();

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`Download completed for ${song.name}`);
          resolve(songPath);
        });
        writer.on('error', reject);
      });

    } catch (error) {
      console.error(`Error in chunked download for ${song.name}:`, error);
      throw error;
    }
  }

  async downloadChunk(url, start, end) {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: {
          Range: `bytes=${start}-${end}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error downloading chunk:', error);
      throw error;
    }
  }

  addToQueue(song, baseUrl, playlistDir) {
    this.downloadQueue.push({ song, baseUrl, playlistDir });
    this.processQueue();
  }

  async processQueue() {
    if (this.downloadQueue.length === 0) return;

    const { song, baseUrl, playlistDir } = this.downloadQueue[0];
    this.downloadQueue.shift();

    try {
      await this.downloadSongInChunks(song, baseUrl, playlistDir);
    } catch (error) {
      console.error('Error processing download queue:', error);
    }

    this.processQueue();
  }
}

module.exports = new ChunkDownloadManager();
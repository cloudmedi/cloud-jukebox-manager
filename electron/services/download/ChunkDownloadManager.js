const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const storageService = require('../storage/StorageService');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    this.MAX_CONCURRENT_DOWNLOADS = 10; // Paralel indirme sayısını 10'a çıkardık
    this.BUFFER_SIZE = 5 * 1024 * 1024; // 5MB buffer
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.downloadBuffer = new Map();
  }

  async downloadSongInChunks(song, baseUrl, playlistDir) {
    try {
      console.log(`Starting chunked download for song: ${song.name}`);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      const response = await axios.head(songUrl);
      const fileSize = parseInt(response.headers['content-length'], 10);
      const totalChunks = Math.ceil(fileSize / this.CHUNK_SIZE);

      console.log(`File size: ${fileSize}, Total chunks: ${totalChunks}`);

      // Yüksek performanslı write stream oluştur
      const writer = fs.createWriteStream(songPath, {
        highWaterMark: this.BUFFER_SIZE
      });

      let downloadedChunks = 0;
      let firstChunkDownloaded = false;

      // Paralel chunk indirme için Promise.all kullanıyoruz
      const chunkPromises = [];

      for (let i = 0; i < totalChunks; i++) {
        const start = i * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);

        const chunkPromise = this.downloadChunk(songUrl, start, end)
          .then(chunk => {
            writer.write(chunk);
            downloadedChunks++;

            // İlk chunk indiğinde hemen event fırlat
            if (!firstChunkDownloaded && i === 0) {
              firstChunkDownloaded = true;
              console.log(`First chunk ready for ${song.name}`);
              this.emit('firstChunkReady', {
                songId: song._id,
                songPath,
                buffer: chunk
              });
            }

            // Progress bildirimi
            const progress = Math.floor((downloadedChunks / totalChunks) * 100);
            this.emit('progress', {
              songId: song._id,
              progress,
              isFirstChunk: i === 0,
              isComplete: downloadedChunks === totalChunks,
              downloadedSize: downloadedChunks * this.CHUNK_SIZE,
              totalSize: fileSize
            });
          })
          .catch(error => {
            console.error(`Error downloading chunk ${i} for ${song.name}:`, error);
            throw error;
          });

        chunkPromises.push(chunkPromise);

        // Paralel indirme limitini kontrol et
        if (chunkPromises.length >= this.MAX_CONCURRENT_DOWNLOADS) {
          await Promise.all(chunkPromises);
          chunkPromises.length = 0;
        }
      }

      // Kalan chunk'ları tamamla
      if (chunkPromises.length > 0) {
        await Promise.all(chunkPromises);
      }

      return new Promise((resolve, reject) => {
        writer.end();
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
        },
        timeout: 30000 // 30 saniye timeout
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

    while (this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS && this.downloadQueue.length > 0) {
      const { song, baseUrl, playlistDir } = this.downloadQueue.shift();
      
      this.activeDownloads.set(song._id, {
        song,
        baseUrl,
        playlistDir,
        startTime: Date.now()
      });

      try {
        await this.downloadSongInChunks(song, baseUrl, playlistDir);
        this.activeDownloads.delete(song._id);
      } catch (error) {
        console.error('Error processing download queue:', error);
        this.activeDownloads.delete(song._id);
      }
    }

    // Kuyrukta hala öğe varsa devam et
    if (this.downloadQueue.length > 0) {
      this.processQueue();
    }
  }
}

module.exports = new ChunkDownloadManager();
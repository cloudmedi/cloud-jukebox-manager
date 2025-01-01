const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    this.MAX_CONCURRENT_DOWNLOADS = 10;
    this.BUFFER_SIZE = 5 * 1024 * 1024; // 5MB buffer
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.chunkBuffers = new Map(); // Her şarkı için chunk buffer'ları
    this.downloadedChunks = new Map(); // İndirilen chunk'ların takibi
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

      // Chunk buffer'ını hazırla
      this.chunkBuffers.set(song._id, new Map());
      this.downloadedChunks.set(song._id, new Set());

      // Yüksek performanslı write stream
      const writer = fs.createWriteStream(songPath, {
        highWaterMark: this.BUFFER_SIZE,
        flags: 'w'
      });

      let firstChunkDownloaded = false;

      // Chunk indirme işlemlerini başlat
      for (let i = 0; i < totalChunks; i++) {
        const start = i * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);

        try {
          const chunk = await this.downloadChunk(songUrl, start, end);
          
          // Chunk'ı buffer'a kaydet
          this.chunkBuffers.get(song._id).set(i, chunk);
          this.downloadedChunks.get(song._id).add(i);

          // İlk chunk indirildiyse event fırlat
          if (i === 0 && !firstChunkDownloaded) {
            firstChunkDownloaded = true;
            console.log(`First chunk ready for ${song.name}`);
            this.emit('firstChunkReady', {
              songId: song._id,
              songPath,
              buffer: chunk
            });
          }

          // Sıralı chunk'ları dosyaya yaz
          await this.writeOrderedChunks(song._id, writer, totalChunks);

          // Progress bildirimi
          const progress = Math.floor((this.downloadedChunks.get(song._id).size / totalChunks) * 100);
          this.emit('progress', {
            songId: song._id,
            progress,
            isFirstChunk: i === 0,
            isComplete: progress === 100
          });

        } catch (error) {
          console.error(`Error downloading chunk ${i} for ${song.name}:`, error);
          throw error;
        }
      }

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          // Temizlik
          this.chunkBuffers.delete(song._id);
          this.downloadedChunks.delete(song._id);
          resolve(songPath);
        });
        writer.on('error', reject);
        writer.end();
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
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('Error downloading chunk:', error);
      throw error;
    }
  }

  async writeOrderedChunks(songId, writer, totalChunks) {
    const chunks = this.chunkBuffers.get(songId);
    const downloaded = this.downloadedChunks.get(songId);
    let nextChunkToWrite = 0;

    while (chunks.has(nextChunkToWrite)) {
      const chunk = chunks.get(nextChunkToWrite);
      await new Promise((resolve, reject) => {
        writer.write(chunk, (error) => {
          if (error) reject(error);
          else {
            chunks.delete(nextChunkToWrite); // Yazılan chunk'ı buffer'dan sil
            resolve();
          }
        });
      });
      nextChunkToWrite++;
    }
  }

  addToQueue(song, baseUrl, playlistDir) {
    this.downloadQueue.push({ song, baseUrl, playlistDir });
    this.processQueue();
  }

  async processQueue() {
    if (this.downloadQueue.length === 0) return;

    while (
      this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS && 
      this.downloadQueue.length > 0
    ) {
      const download = this.downloadQueue.shift();
      if (download) {
        this.activeDownloads.set(download.song._id, download);
        
        try {
          await this.downloadSongInChunks(
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

module.exports = new ChunkDownloadManager();
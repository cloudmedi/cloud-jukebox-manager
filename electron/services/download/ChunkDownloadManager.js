const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    this.MAX_CONCURRENT_DOWNLOADS = 10;
    this.BUFFER_SIZE = 5 * 1024 * 1024; // 5MB buffer
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.downloadBuffer = new Map();
    this.chunkOrder = new Map(); // Yeni: chunk sırasını takip etmek için
  }

  async downloadSongInChunks(song, baseUrl, playlistDir) {
    try {
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}${song.filePath}`;

      // Get file size
      const response = await axios.head(songUrl);
      const fileSize = parseInt(response.headers['content-length'], 10);
      const totalChunks = Math.ceil(fileSize / this.CHUNK_SIZE);

      console.log(`Starting download for ${song.name}`);
      console.log(`File size: ${fileSize}, Total chunks: ${totalChunks}`);

      // Yüksek performanslı write stream oluştur
      const writer = fs.createWriteStream(songPath, {
        highWaterMark: this.BUFFER_SIZE
      });

      // Her chunk için indirme işlemi başlat
      for (let i = 0; i < totalChunks; i++) {
        const start = i * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);

        const chunkInfo = {
          songId: song._id,
          chunkIndex: i,
          start,
          end,
          url: songUrl,
          writer,
          totalChunks,
          songPath,
          isFirstChunk: i === 0
        };

        this.downloadQueue.push(chunkInfo);
        this.chunkOrder.set(`${song._id}-${i}`, false); // Yeni: chunk durumunu false olarak işaretle
      }

      this.processQueue();

      return songPath;
    } catch (error) {
      console.error(`Error starting download for ${song.name}:`, error);
      throw error;
    }
  }

  async downloadChunk(chunkInfo) {
    try {
      const { start, end, url, songId, chunkIndex, isFirstChunk } = chunkInfo;
      
      const response = await axios({
        method: 'GET',
        url: url,
        headers: {
          Range: `bytes=${start}-${end}`
        },
        responseType: 'arraybuffer'
      });

      // Chunk'ı buffer'a kaydet
      this.downloadBuffer.set(`${songId}-${chunkIndex}`, response.data);
      this.chunkOrder.set(`${songId}-${chunkIndex}`, true); // Yeni: chunk başarıyla indirildi

      // İlk chunk ise ve tüm gerekli parçalar hazırsa event fırlat
      if (isFirstChunk) {
        console.log(`First chunk downloaded for song ${songId}`);
        this.emit('firstChunkReady', {
          songId,
          songPath: chunkInfo.songPath,
          buffer: response.data
        });
      }

      // Sıralı chunk'ları diske yaz
      this.writeOrderedChunks(songId, chunkInfo.writer, chunkInfo.totalChunks);

      return true;
    } catch (error) {
      console.error(`Error downloading chunk ${chunkInfo.chunkIndex}:`, error);
      throw error;
    }
  }

  // Yeni: Sıralı chunk yazma fonksiyonu
  writeOrderedChunks(songId, writer, totalChunks) {
    let nextChunkIndex = 0;

    while (nextChunkIndex < totalChunks) {
      const chunkKey = `${songId}-${nextChunkIndex}`;
      
      // Eğer sıradaki chunk hazır değilse döngüden çık
      if (!this.chunkOrder.get(chunkKey)) {
        break;
      }

      // Chunk'ı buffer'dan al ve diske yaz
      const chunkData = this.downloadBuffer.get(chunkKey);
      if (chunkData) {
        writer.write(chunkData);
        
        // Yazılan chunk'ı buffer'dan temizle
        this.downloadBuffer.delete(chunkKey);
        this.chunkOrder.delete(chunkKey);
        
        nextChunkIndex++;
      }
    }

    // Tüm chunk'lar yazıldıysa stream'i kapat
    if (nextChunkIndex === totalChunks) {
      writer.end();
      console.log(`All chunks written for song ${songId}`);
    }
  }

  async processQueue() {
    while (this.downloadQueue.length > 0 && this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS) {
      const chunkInfo = this.downloadQueue.shift();
      if (!chunkInfo) continue;

      const downloadKey = `${chunkInfo.songId}-${chunkInfo.chunkIndex}`;
      if (this.activeDownloads.has(downloadKey)) continue;

      this.activeDownloads.set(downloadKey, true);

      try {
        await this.downloadChunk(chunkInfo);
      } finally {
        this.activeDownloads.delete(downloadKey);
        this.processQueue();
      }
    }
  }
}

module.exports = new ChunkDownloadManager();
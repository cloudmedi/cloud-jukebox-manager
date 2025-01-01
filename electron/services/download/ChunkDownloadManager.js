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
    this.chunkBuffers = new Map();
    this.downloadedChunks = new Map();
  }

  async downloadSongInChunks(song, baseUrl, playlistDir) {
    try {
      console.log(`Starting chunked download for song: ${song.name}`);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      // İlk chunk'ı hemen indir ve oynatmaya başla
      const firstChunkSize = 1024 * 1024; // 1MB
      const firstChunkResponse = await axios({
        url: songUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: {
          Range: `bytes=0-${firstChunkSize - 1}`
        }
      });

      // İlk chunk'ı dosyaya yaz
      fs.writeFileSync(songPath, Buffer.from(firstChunkResponse.data));
      
      // İlk chunk hazır eventi
      console.log(`First chunk ready for ${song.name}, emitting event`);
      this.emit('firstChunkReady', {
        songId: song._id,
        songPath,
        buffer: firstChunkResponse.data
      });

      // Geri kalan dosyayı arka planda indir
      const response = await axios.head(songUrl);
      const fileSize = parseInt(response.headers['content-length'], 10);
      
      // İlk chunk sonrası kalan chunk'ları indir
      for (let start = firstChunkSize; start < fileSize; start += this.CHUNK_SIZE) {
        const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);
        
        try {
          const chunk = await this.downloadChunk(songUrl, start, end);
          
          // Chunk'ı dosyaya ekle
          fs.appendFileSync(songPath, Buffer.from(chunk));

          // İndirme durumunu bildir
          const progress = Math.floor((start + chunk.length) / fileSize * 100);
          this.emit('progress', {
            songId: song._id,
            progress,
            isComplete: progress === 100
          });

        } catch (error) {
          console.error(`Error downloading chunk for ${song.name}:`, error);
          throw error;
        }
      }

      console.log(`Download completed for ${song.name}`);
      return songPath;

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
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const ChecksumUtils = require('./utils/checksumUtils');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = 3;
    this.maxRetries = 3;
    this.retryDelays = [2000, 4000, 8000]; // Exponential backoff
    this.isProcessing = false;
    this.timeout = 30000; // 30 saniye timeout
  }

  calculateChunkSize(fileSize) {
    // Dosya boyutuna göre dinamik chunk boyutu hesaplama
    if (fileSize < 10 * 1024 * 1024) { // 10MB'dan küçük
      return 512 * 1024; // 512KB chunks
    } else if (fileSize < 100 * 1024 * 1024) { // 10MB-100MB arası
      return 1024 * 1024; // 1MB chunks
    } else {
      return 2 * 1024 * 1024; // 2MB chunks
    }
  }

  async downloadSong(song, baseUrl, playlistDir) {
    try {
      console.log(`Starting chunked download for song: ${song.name}`);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
      const tempPath = `${songPath}.temp`;

      // Get file size
      const { headers } = await axios.head(songUrl, { timeout: this.timeout });
      const fileSize = parseInt(headers['content-length'], 10);
      const chunkSize = this.calculateChunkSize(fileSize);
      
      // Resume kontrolü
      let startByte = 0;
      if (fs.existsSync(tempPath)) {
        const stats = fs.statSync(tempPath);
        startByte = stats.size;
        console.log(`Resuming download from byte ${startByte}`);
      }

      const chunks = Math.ceil((fileSize - startByte) / chunkSize);
      const writer = fs.createWriteStream(tempPath, { flags: startByte ? 'a' : 'w' });
      
      for (let i = 0; i < chunks; i++) {
        const start = startByte + (i * chunkSize);
        const end = Math.min(start + chunkSize - 1, fileSize - 1);
        
        let retryCount = 0;
        let success = false;

        while (!success && retryCount < this.maxRetries) {
          try {
            const chunk = await this.downloadChunk(songUrl, start, end, song._id);
            
            // Chunk checksum kontrolü
            const chunkChecksum = await ChecksumUtils.calculateSHA256(chunk);
            
            writer.write(chunk);
            success = true;

            // İlerleme durumunu bildir
            const progress = Math.round(((i + 1) / chunks) * 100);
            this.emit('progress', { songId: song._id, progress });

          } catch (error) {
            retryCount++;
            console.error(`Chunk download error (attempt ${retryCount}/${this.maxRetries}):`, error);
            
            if (retryCount === this.maxRetries) {
              throw new Error(`Failed to download chunk after ${this.maxRetries} attempts`);
            }
            
            // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, this.retryDelays[retryCount - 1]));
          }
        }
      }

      await new Promise((resolve) => writer.end(resolve));
      
      // Final checksum verification
      if (song.checksum) {
        const isValid = await ChecksumUtils.verifyFileChecksum(tempPath, song.checksum);
        if (!isValid) {
          throw new Error('Final checksum verification failed');
        }
      }

      // Rename temp file to final file
      fs.renameSync(tempPath, songPath);
      
      console.log(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      console.error(`Error downloading song ${song.name}:`, error);
      // Cleanup temp file in case of error
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
      throw error;
    }
  }

  async downloadChunk(url, start, end, songId) {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: this.timeout,
        headers: {
          Range: `bytes=${start}-${end}`
        }
      });

      return response.data;

    } catch (error) {
      console.error(`Error downloading chunk for song ${songId}:`, error);
      throw error;
    }
  }

  queueSongDownload(song, baseUrl, playlistDir) {
    console.log(`Adding song to queue: ${song.name}`);
    this.downloadQueue.push({ song, baseUrl, playlistDir });
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
          const { song, baseUrl, playlistDir } = download;
          this.activeDownloads.set(song._id, download);
          
          try {
            await this.downloadSong(song, baseUrl, playlistDir);
            this.emit('songDownloaded', song._id);
          } finally {
            this.activeDownloads.delete(song._id);
          }
        }
      }
    } finally {
      this.isProcessing = false;
      
      // If there are more items in queue, continue processing
      if (this.downloadQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  clearDownload(songId) {
    this.activeDownloads.delete(songId);
    this.downloadQueue = this.downloadQueue.filter(item => item.song._id !== songId);
  }
}

module.exports = new ChunkDownloadManager();
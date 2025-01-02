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
    this.chunkSize = 1024 * 1024; // 1MB chunks
    this.maxRetries = 3;
    this.isProcessing = false;
  }

  async downloadSongWithChunks(song, baseUrl, playlistDir) {
    try {
      console.log(`Starting chunked download for song: ${song.name}`);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
      const tempPath = `${songPath}.temp`;

      // Get file size
      const { headers } = await axios.head(songUrl);
      const fileSize = parseInt(headers['content-length'], 10);
      
      // Check if partial file exists
      let startByte = 0;
      if (fs.existsSync(tempPath)) {
        const stats = fs.statSync(tempPath);
        startByte = stats.size;
        console.log(`Resuming download from byte ${startByte}`);
      }

      const chunks = Math.ceil((fileSize - startByte) / this.chunkSize);
      const writer = fs.createWriteStream(tempPath, { flags: startByte ? 'a' : 'w' });
      
      for (let i = 0; i < chunks; i++) {
        const start = startByte + (i * this.chunkSize);
        const end = Math.min(start + this.chunkSize - 1, fileSize - 1);
        
        await this.downloadChunk(songUrl, start, end, writer, song._id);
        
        // Emit progress
        const progress = Math.round(((i + 1) / chunks) * 100);
        this.emit('progress', { songId: song._id, progress });
      }

      writer.end();
      
      // Verify checksum after download
      await new Promise((resolve) => writer.on('finish', resolve));
      
      if (song.checksum) {
        const isValid = await ChecksumUtils.verifyFileChecksum(tempPath, song.checksum);
        if (!isValid) {
          throw new Error('Checksum verification failed');
        }
      }

      // Rename temp file to final file
      fs.renameSync(tempPath, songPath);
      
      console.log(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      console.error(`Error downloading song ${song.name}:`, error);
      throw error;
    }
  }

  async downloadChunk(url, start, end, writer, songId, retryCount = 0) {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
          Range: `bytes=${start}-${end}`
        }
      });

      return new Promise((resolve, reject) => {
        response.data.pipe(writer, { end: false });
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });

    } catch (error) {
      if (retryCount < this.maxRetries) {
        console.log(`Retrying chunk download (${retryCount + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.downloadChunk(url, start, end, writer, songId, retryCount + 1);
      }
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
            await this.downloadSongWithChunks(song, baseUrl, playlistDir);
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
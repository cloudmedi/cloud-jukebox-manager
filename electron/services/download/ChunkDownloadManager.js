const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const RetryManager = require('./RetryManager');
const ChecksumUtils = require('./utils/checksumUtils');
const DownloadQueue = require('./DownloadQueue');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.retryManager = new RetryManager();
    this.downloadQueue = new DownloadQueue();
    this.activeDownloads = new Map();
    
    this.MIN_CHUNK_SIZE = 256 * 1024;
    this.MAX_CHUNK_SIZE = 2 * 1024 * 1024;
    this.DEFAULT_CHUNK_SIZE = 1024 * 1024;
    this.CHUNK_SIZE = this.DEFAULT_CHUNK_SIZE;
    this.MAX_CONCURRENT_DOWNLOADS = 3;
  }

  async downloadChunk(url, start, end) {
    const operation = async () => {
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
    };

    return await this.retryManager.executeWithRetry(
      operation,
      `Chunk download: ${url} (${start}-${end})`
    );
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

      // Initialize download tracking
      this.activeDownloads.set(song._id, {
        progress: 0,
        chunks: [],
        totalChunks
      });

      // Download chunks
      const chunks = [];
      for (let start = 0; start < fileSize; start += this.CHUNK_SIZE) {
        const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);
        
        const chunk = await this.downloadChunk(songUrl, start, end);
        chunks.push(chunk);

        const progress = Math.floor((start + chunk.length) / fileSize * 100);
        
        // Update progress
        const downloadInfo = this.activeDownloads.get(song._id);
        if (downloadInfo) {
          downloadInfo.progress = progress;
          downloadInfo.chunks = chunks;
        }

        this.emit('progress', {
          songId: song._id,
          progress,
          isComplete: progress === 100
        });
      }

      // Write file
      const buffer = Buffer.concat(chunks);
      fs.writeFileSync(songPath, buffer);

      // Cleanup
      this.activeDownloads.delete(song._id);

      console.log(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      console.error(`Error in chunked download for ${song.name}:`, error);
      throw error;
    }
  }

  addToQueue(song, baseUrl, playlistDir) {
    console.log(`Adding song to queue: ${song.name}`);
    this.downloadQueue.add({
      song,
      baseUrl,
      playlistDir
    });
    this.processQueue();
  }

  async processQueue() {
    if (this.downloadQueue.isEmpty()) {
      console.log('Download queue is empty');
      return;
    }

    while (
      this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS && 
      !this.downloadQueue.isEmpty()
    ) {
      const download = this.downloadQueue.next();
      if (download) {
        console.log(`Processing download for: ${download.song.name}`);
        
        try {
          await this.downloadSongInChunks(
            download.song,
            download.baseUrl,
            download.playlistDir
          );
          console.log(`Download completed for: ${download.song.name}`);
        } catch (error) {
          console.error(`Download failed for: ${download.song.name}`, error);
        }
      }
    }

    // Continue processing queue if there are more items
    if (!this.downloadQueue.isEmpty()) {
      this.processQueue();
    }
  }
}

module.exports = new ChunkDownloadManager();
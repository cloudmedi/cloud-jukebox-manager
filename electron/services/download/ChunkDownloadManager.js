const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const RetryManager = require('./RetryManager');
const ChecksumUtils = require('./utils/checksumUtils');
const DownloadQueue = require('./DownloadQueue');
const ChunkStorage = require('./ChunkStorage');
const DownloadProgress = require('./DownloadProgress');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.retryManager = new RetryManager();
    this.downloadQueue = new DownloadQueue();
    this.chunkStorage = new ChunkStorage();
    this.downloadProgress = new DownloadProgress();
    
    this.setupRetryListener();
    
    this.MIN_CHUNK_SIZE = 256 * 1024;
    this.MAX_CHUNK_SIZE = 2 * 1024 * 1024;
    this.DEFAULT_CHUNK_SIZE = 1024 * 1024;
    this.CHUNK_SIZE = this.DEFAULT_CHUNK_SIZE;
    this.MAX_CONCURRENT_DOWNLOADS = 3;
  }

  setupRetryListener() {
    this.retryManager.on('retry', ({ attempt, maxAttempts, error, context }) => {
      console.log(`Retry attempt ${attempt}/${maxAttempts} for ${context}: ${error}`);
      this.emit('downloadRetry', { attempt, maxAttempts, error, context });
    });
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

      const chunk = response.data;
      const md5Checksum = response.headers['x-chunk-md5'];

      if (md5Checksum) {
        const isValid = await ChecksumUtils.verifyChunkChecksum(chunk, md5Checksum);
        if (!isValid) {
          throw new Error('Chunk MD5 verification failed');
        }
      }

      return chunk;
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

      // İlk chunk'ı indir
      const firstChunkSize = this.CHUNK_SIZE;
      const firstChunk = await this.downloadChunk(songUrl, 0, firstChunkSize - 1);

      // Initialize storage for this song
      this.chunkStorage.initializeForSong(song._id);
      this.chunkStorage.addChunk(song._id, firstChunk);

      fs.writeFileSync(songPath, Buffer.from(firstChunk));
      
      this.emit('firstChunkReady', {
        songId: song._id,
        songPath,
        buffer: firstChunk
      });

      // Get file size and checksum
      const response = await axios.head(songUrl);
      const fileSize = parseInt(response.headers['content-length'], 10);
      const expectedSHA256 = response.headers['x-file-sha256'];
      const totalChunks = Math.ceil(fileSize / this.CHUNK_SIZE);
      
      this.downloadProgress.initializeDownload(song._id, totalChunks);
      
      // Download remaining chunks
      for (let start = firstChunkSize; start < fileSize; start += this.CHUNK_SIZE) {
        const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);
        
        const chunk = await this.downloadChunk(songUrl, start, end);
        this.chunkStorage.addChunk(song._id, chunk);
        
        fs.appendFileSync(songPath, Buffer.from(chunk));

        const progress = Math.floor((start + chunk.length) / fileSize * 100);
        this.downloadProgress.updateProgress(song._id, progress);

        this.emit('progress', {
          songId: song._id,
          progress,
          isComplete: progress === 100
        });
      }

      if (expectedSHA256) {
        const isValid = await ChecksumUtils.verifyFileChecksum(songPath, expectedSHA256);
        if (!isValid) {
          throw new Error('File SHA-256 verification failed');
        }
      }

      this.downloadProgress.completeDownload(song._id);
      this.chunkStorage.clearSong(song._id);

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
      this.downloadProgress.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS && 
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
        } finally {
          this.processQueue();
        }
      }
    }
  }
}

module.exports = new ChunkDownloadManager();
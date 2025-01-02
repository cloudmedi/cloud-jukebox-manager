const { EventEmitter } = require('events');
const { createLogger } = require('../../utils/logger');
const bandwidthManager = require('./managers/BandwidthManager');
const chunkManager = require('./managers/ChunkManager');
const downloadStateManager = require('./DownloadStateManager');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = bandwidthManager.maxConcurrentDownloads;
    this.isProcessing = false;
  }

  async downloadChunk(url, start, end, songId, playlistId) {
    const downloadId = `${songId}-${Date.now()}`;
    
    try {
      if (!bandwidthManager.startDownload(downloadId)) {
        logger.info('[QUEUE] Download delayed due to bandwidth limits', { songId });
        return new Promise(resolve => setTimeout(() => resolve(
          this.downloadChunk(url, start, end, songId, playlistId)
        ), 1000));
      }

      const chunk = await chunkManager.downloadChunk(url, start, end, songId, downloadId);
      bandwidthManager.finishDownload(downloadId);
      return chunk;

    } catch (error) {
      bandwidthManager.finishDownload(downloadId);
      throw error;
    }
  }

  async downloadSong(song, baseUrl, playlistDir) {
    logger.info('[SONG DOWNLOAD] Starting', { 
      songId: song._id,
      name: song.name
    });

    const songPath = path.join(playlistDir, `${song._id}.mp3`);
    const tempSongPath = `${songPath}.temp`;
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

    const { headers } = await axios.head(songUrl);
    const fileSize = parseInt(headers['content-length'], 10);
    const chunkSize = this.calculateChunkSize(fileSize);
    
    let startByte = 0;
    if (fs.existsSync(tempSongPath)) {
      const stats = fs.statSync(tempSongPath);
      startByte = stats.size;
      logger.info(`Resuming download from byte ${startByte}`);
    }

    const chunks = Math.ceil((fileSize - startByte) / chunkSize);
    const writer = fs.createWriteStream(tempSongPath, { flags: startByte ? 'a' : 'w' });
    
    try {
      for (let i = 0; i < chunks; i++) {
        const start = startByte + (i * chunkSize);
        const end = Math.min(start + chunkSize - 1, fileSize - 1);
        
        const chunk = await this.downloadChunk(songUrl, start, end, song._id, playlistDir);
        writer.write(chunk);

        const progress = Math.round(((i + 1) / chunks) * 100);
        this.emit('progress', { 
          songId: song._id, 
          progress,
          downloadedSize: start + chunk.length,
          totalSize: fileSize,
          currentChunk: i + 1,
          totalChunks: chunks
        });
      }

      await new Promise((resolve) => writer.end(resolve));
      
      fs.renameSync(tempSongPath, songPath);
      logger.info(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      logger.error(`Error downloading song ${song.name}:`, error);
      if (fs.existsSync(tempSongPath)) {
        fs.unlinkSync(tempSongPath);
      }
      throw error;
    }
  }

  queueSongDownload(song, baseUrl, playlistDir) {
    logger.info('[QUEUE] Adding song', {
      songId: song._id,
      name: song.name
    });
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
      
      if (this.downloadQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  calculateChunkSize(fileSize) {
    // Dosya boyutuna göre dinamik chunk boyutu
    if (fileSize < 10 * 1024 * 1024) { // 10MB'dan küçük
      return 256 * 1024; // 256KB
    } else if (fileSize < 50 * 1024 * 1024) { // 50MB'dan küçük
      return 512 * 1024; // 512KB
    } else if (fileSize < 100 * 1024 * 1024) { // 100MB'dan küçük
      return 1024 * 1024; // 1MB
    } else {
      return 2 * 1024 * 1024; // 2MB
    }
  }
}

module.exports = new ChunkDownloadManager();

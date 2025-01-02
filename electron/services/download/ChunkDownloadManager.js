const BaseDownloadManager = require('./managers/BaseDownloadManager');
const ChunkManager = require('./managers/ChunkManager');
const { createLogger } = require('../../utils/logger');
const downloadStateManager = require('./DownloadStateManager');
const ChecksumVerifier = require('./utils/ChecksumVerifier');
const fs = require('fs');
const path = require('path');

class ChunkDownloadManager extends BaseDownloadManager {
  constructor() {
    super();
    this.logger = createLogger('chunk-download-manager');
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = 3;
    this.isProcessing = false;

    this.resumeIncompleteDownloads();
  }

  async resumeIncompleteDownloads() {
    const incompleteDownloads = downloadStateManager.getIncompleteDownloads();
    this.logger.info(`Found ${incompleteDownloads.length} incomplete downloads to resume`);

    for (const playlist of incompleteDownloads) {
      for (const song of playlist.songs) {
        if (song.status !== 'completed') {
          const downloadState = downloadStateManager.getSongDownloadState(song.id);
          if (downloadState.chunks) {
            this.queueSongDownload(song, playlist.baseUrl, playlist.downloadPath, true);
          }
        }
      }
    }
  }

  async downloadSong(song, baseUrl, playlistDir, isResume = false) {
    this.logger.info(`Starting download for song: ${song.name}`);
    
    const songPath = path.join(playlistDir, `${song._id}.mp3`);
    const tempSongPath = `${songPath}.temp`;
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

    const { fileSize } = await this.validateDownload(songUrl);
    const chunkSize = this.calculateChunkSize(fileSize);
    
    let startByte = 0;
    if (fs.existsSync(tempSongPath)) {
      const stats = fs.statSync(tempSongPath);
      startByte = stats.size;
      this.logger.info(`Resuming download from byte ${startByte}`);
    }

    const chunks = Math.ceil((fileSize - startByte) / chunkSize);
    const writer = fs.createWriteStream(tempSongPath, { flags: startByte ? 'a' : 'w' });
    
    try {
      for (let i = 0; i < chunks; i++) {
        const start = startByte + (i * chunkSize);
        const end = Math.min(start + chunkSize - 1, fileSize - 1);
        
        const chunk = await ChunkManager.downloadChunk(
          songUrl, 
          start, 
          end, 
          song._id,
          `${song._id}-${Date.now()}`
        );

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
      
      if (song.checksum) {
        const isValid = await ChecksumVerifier.verifyFileChecksum(tempSongPath, song.checksum);
        if (!isValid) {
          throw new Error('Final checksum verification failed');
        }
      }

      fs.renameSync(tempSongPath, songPath);
      this.logger.info(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      this.logger.error(`Error downloading song ${song.name}:`, error);
      if (fs.existsSync(tempSongPath)) {
        fs.unlinkSync(tempSongPath);
      }
      throw error;
    }
  }

  queueSongDownload(song, baseUrl, playlistDir, isResume = false) {
    this.logger.info(`Adding song to queue: ${song.name}`);
    this.downloadQueue.push({ song, baseUrl, playlistDir, isResume });
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
}

module.exports = new ChunkDownloadManager();
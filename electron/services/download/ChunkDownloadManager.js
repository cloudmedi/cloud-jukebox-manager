const path = require('path');
const axios = require('axios');
const { EventEmitter } = require('events');
const { createLogger } = require('../../utils/logger');
const downloadStateManager = require('./managers/DownloadStateManager');
const chunkManager = require('./managers/ChunkManager');
const retryManager = require('./managers/RetryManager');
const fileWriterService = require('./io/FileWriterService');
const downloadVerificationService = require('./verification/DownloadVerificationService');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.maxConcurrentDownloads = 3;
    this.isProcessing = false;
  }

  async downloadSong(song, baseUrl, playlistDir) {
    const tempSongPath = path.join(playlistDir, `${song._id}.mp3.temp`);
    const finalSongPath = path.join(playlistDir, `${song._id}.mp3`);

    // Check existing final file
    if (fs.existsSync(finalSongPath)) {
      const isValid = await downloadVerificationService.verifyFinalFile(
        finalSongPath, 
        song.checksum,
        song.name
      );
      
      if (isValid) {
        logger.info(`Song already exists and verified: ${song.name}`);
        return finalSongPath;
      }
      
      fileWriterService.cleanup(finalSongPath);
    }

    return await retryManager.executeWithRetry(async () => {
      try {
        const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
        const { headers } = await axios.head(songUrl);
        const fileSize = parseInt(headers['content-length'], 10);
        const chunkSize = chunkManager.calculateChunkSize(fileSize);
        
        let startByte = await this.determineStartByte(tempSongPath, fileSize, song);
        const chunks = Math.ceil((fileSize - startByte) / chunkSize);

        for (let i = Math.floor(startByte / chunkSize); i < chunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize - 1, fileSize - 1);
          
          const chunk = await chunkManager.downloadChunk(songUrl, start, end, song._id);
          
          const isChunkValid = await downloadVerificationService.verifyChunk(
            chunk,
            song.name,
            i + 1,
            chunks
          );

          if (!isChunkValid) {
            throw new Error(`Chunk verification failed for ${song.name}`);
          }

          await fileWriterService.writeChunk(tempSongPath, chunk, startByte > 0 || i > 0);

          await this.updateDownloadProgress(song, i, chunks, start, chunk.length, fileSize);
        }

        const isValid = await downloadVerificationService.verifyFinalFile(
          tempSongPath,
          song.checksum,
          song.name
        );

        if (!isValid) {
          fileWriterService.cleanup(tempSongPath);
          throw new Error(`Final verification failed for ${song.name}`);
        }

        const moved = await fileWriterService.moveFile(tempSongPath, finalSongPath);
        if (!moved) {
          throw new Error(`Failed to move file for ${song.name}`);
        }

        downloadStateManager.saveState(song._id, song.playlistId, { completed: true });
        logger.info(`Download completed for ${song.name}`);
        
        return finalSongPath;
      } catch (error) {
        logger.error(`Error downloading song ${song.name}:`, error);
        fileWriterService.cleanup(tempSongPath);
        throw error;
      }
    }, `download song ${song.name}`);
  }

  async determineStartByte(tempSongPath, fileSize, song) {
    let startByte = 0;
    const downloadState = downloadStateManager.getState(song._id, song.playlistId);
    
    if (downloadState && fs.existsSync(tempSongPath)) {
      try {
        const stats = fs.statSync(tempSongPath);
        if (stats.size < fileSize) {
          startByte = stats.size;
          logger.info(`Resuming download from byte ${startByte}`);
        } else {
          fileWriterService.cleanup(tempSongPath);
        }
      } catch (error) {
        logger.error(`Error checking temp file: ${tempSongPath}`, error);
        fileWriterService.cleanup(tempSongPath);
      }
    }
    
    return startByte;
  }

  async updateDownloadProgress(song, currentChunk, totalChunks, downloadedSize, chunkSize, totalSize) {
    downloadStateManager.saveState(song._id, song.playlistId, {
      downloadedChunks: currentChunk + 1,
      totalChunks,
      completed: false
    });

    const progress = Math.round(((currentChunk + 1) / totalChunks) * 100);
    this.emit('progress', { 
      songId: song._id,
      playlistId: song.playlistId, 
      progress,
      downloadedSize: downloadedSize + chunkSize,
      totalSize,
      currentChunk: currentChunk + 1,
      totalChunks
    });
  }

  queueSongDownload(song, baseUrl, playlistDir) {
    logger.info(`Adding song to queue: ${song.name}`);
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
          } catch (error) {
            logger.error(`Failed to download song ${song.name}:`, error);
            this.emit('songError', { songId: song._id, error });
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

  resumeIncompleteDownloads(playlistId, baseUrl, playlistDir) {
    const incompleteDownloads = downloadStateManager.getIncompleteDownloads(playlistId);
    for (const download of incompleteDownloads) {
      this.queueSongDownload(download.song, baseUrl, playlistDir);
    }
  }
}

module.exports = new ChunkDownloadManager();

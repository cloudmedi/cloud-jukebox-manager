const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { EventEmitter } = require('events');
const { createLogger } = require('../../utils/logger');
const ChecksumVerifier = require('./utils/ChecksumVerifier');
const chunkManager = require('./managers/ChunkManager');
const downloadStateManager = require('./managers/DownloadStateManager');
const retryManager = require('./managers/RetryManager');

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

    // Check if final file exists and is valid
    if (fs.existsSync(finalSongPath)) {
      try {
        const isValid = await ChecksumVerifier.verifyFileChecksum(finalSongPath, song.checksum);
        if (isValid) {
          logger.info(`Song already exists and verified: ${song.name}`);
          return finalSongPath;
        }
        logger.warn(`Invalid checksum for existing file: ${song.name}, re-downloading`);
        fs.unlinkSync(finalSongPath);
      } catch (error) {
        logger.error(`Error verifying existing file: ${song.name}`, error);
        fs.unlinkSync(finalSongPath);
      }
    }

    return await retryManager.executeWithRetry(async () => {
      try {
        logger.info(`Starting download for song: ${song.name}`);
        
        const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
        const { headers } = await axios.head(songUrl);
        const fileSize = parseInt(headers['content-length'], 10);
        const chunkSize = chunkManager.calculateChunkSize(fileSize);
        
        // Check existing download state
        let startByte = 0;
        const downloadState = downloadStateManager.getState(song._id, song.playlistId);
        
        if (downloadState && fs.existsSync(tempSongPath)) {
          try {
            const stats = fs.statSync(tempSongPath);
            if (stats.size < fileSize) {
              startByte = stats.size;
              logger.info(`Resuming download from byte ${startByte}`);
            }
          } catch (error) {
            logger.error(`Error checking temp file: ${tempSongPath}`, error);
            if (fs.existsSync(tempSongPath)) {
              fs.unlinkSync(tempSongPath);
            }
          }
        }

        const chunks = Math.ceil((fileSize - startByte) / chunkSize);
        const writer = fs.createWriteStream(tempSongPath, { flags: startByte ? 'a' : 'w' });

        for (let i = Math.floor(startByte / chunkSize); i < chunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize - 1, fileSize - 1);
          
          const chunk = await chunkManager.downloadChunk(songUrl, start, end, song._id);
          
          // Verify chunk checksum before writing
          const chunkChecksum = await ChecksumVerifier.calculateMD5(chunk);
          if (!await ChecksumVerifier.verifyChunkChecksum(chunk, chunkChecksum)) {
            throw new Error(`Chunk checksum verification failed for ${song.name} chunk ${i + 1}/${chunks}`);
          }

          writer.write(chunk);

          downloadStateManager.saveState(song._id, song.playlistId, {
            downloadedChunks: i + 1,
            totalChunks: chunks,
            tempPath: tempSongPath,
            finalPath: finalSongPath,
            completed: false
          });

          const progress = Math.round(((i + 1) / chunks) * 100);
          this.emit('progress', { 
            songId: song._id,
            playlistId: song.playlistId, 
            progress,
            downloadedSize: start + chunk.length,
            totalSize: fileSize,
            currentChunk: i + 1,
            totalChunks: chunks
          });
        }

        await new Promise((resolve, reject) => {
          writer.end((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        // Final checksum verification with retry
        const isValid = await retryManager.executeWithRetry(
          async () => {
            const result = await ChecksumVerifier.verifyFileChecksum(tempSongPath, song.checksum);
            if (!result) {
              logger.warn(`Final checksum verification failed for ${song.name}, retrying...`);
            }
            return result;
          },
          `final checksum verification for ${song.name}`
        );

        if (!isValid) {
          throw new Error(`Final checksum verification failed for ${song.name}`);
        }

        // Rename temp file to final file
        fs.renameSync(tempSongPath, finalSongPath);
        downloadStateManager.saveState(song._id, song.playlistId, { completed: true });
        logger.info(`Download completed for ${song.name}`);
        
        return finalSongPath;
      } catch (error) {
        logger.error(`Error downloading song ${song.name}:`, error);
        // Clean up temp file if exists
        if (fs.existsSync(tempSongPath)) {
          fs.unlinkSync(tempSongPath);
        }
        throw error;
      }
    }, `download song ${song.name}`);
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
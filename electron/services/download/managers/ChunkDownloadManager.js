const axios = require('axios');
const fs = require('fs');
const path = require('path');
const BaseDownloadManager = require('./BaseDownloadManager');
const TimeoutManager = require('../utils/TimeoutManager');
const NetworkErrorHandler = require('../utils/NetworkErrorHandler');
const ChecksumVerifier = require('../utils/ChecksumVerifier');
const websocketService = require('../../websocketService');
const bandwidthManager = require('../BandwidthManager');

class ChunkDownloadManager extends BaseDownloadManager {
  constructor() {
    super();
    this.timeoutManager = new TimeoutManager();
    this.maxConcurrentDownloads = bandwidthManager.maxConcurrentDownloads;
  }

  async downloadChunk(url, start, end, songId, playlistId) {
    const chunkId = `${songId}-${start}`;
    const downloadId = `${songId}-${Date.now()}`;
    
    try {
      if (!bandwidthManager.startDownload(downloadId)) {
        this.logger.warn(`Download delayed due to bandwidth limits`, { chunkId });
        return new Promise(resolve => setTimeout(() => resolve(
          this.downloadChunk(url, start, end, songId, playlistId)
        ), 1000));
      }

      // WebSocket üzerinden chunk başlangıç bildirimi
      websocketService.sendMessage({
        type: 'downloadProgress',
        data: {
          songId,
          chunkId,
          status: 'downloading',
          startByte: start,
          endByte: end
        }
      });

      const chunk = await this._performChunkDownload(url, start, end, songId, downloadId);
      
      // WebSocket üzerinden chunk tamamlanma bildirimi
      websocketService.sendMessage({
        type: 'downloadProgress',
        data: {
          songId,
          chunkId,
          status: 'completed',
          size: chunk.length
        }
      });

      bandwidthManager.finishDownload(downloadId);
      return chunk;

    } catch (error) {
      bandwidthManager.finishDownload(downloadId);
      
      // WebSocket üzerinden hata bildirimi
      websocketService.sendMessage({
        type: 'downloadProgress',
        data: {
          songId,
          chunkId,
          status: 'error',
          error: error.message
        }
      });
      
      throw error;
    }
  }

  async downloadSong(song, baseUrl, playlistDir) {
    this.logger.info(`Starting download for song: ${song.name}`);
    
    const songPath = path.join(playlistDir, `${song._id}.mp3`);
    const tempSongPath = `${songPath}.temp`;
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

    // WebSocket üzerinden şarkı indirme başlangıç bildirimi
    websocketService.sendMessage({
      type: 'downloadProgress',
      data: {
        songId: song._id,
        status: 'started',
        name: song.name
      }
    });

    try {
      const { headers } = await axios.head(songUrl);
      const fileSize = parseInt(headers['content-length'], 10);
      const chunkSize = this.calculateChunkSize(fileSize);
      
      let startByte = 0;
      if (fs.existsSync(tempSongPath)) {
        const stats = fs.statSync(tempSongPath);
        startByte = stats.size;
        this.logger.info(`Resuming download from byte ${startByte}`);
      }

      const chunks = Math.ceil((fileSize - startByte) / chunkSize);
      const writer = fs.createWriteStream(tempSongPath, { flags: startByte ? 'a' : 'w' });
      
      for (let i = 0; i < chunks; i++) {
        const start = startByte + (i * chunkSize);
        const end = Math.min(start + chunkSize - 1, fileSize - 1);
        
        const chunk = await this.downloadChunk(songUrl, start, end, song._id, playlistDir);
        writer.write(chunk);

        const progress = Math.round(((i + 1) / chunks) * 100);
        
        // WebSocket üzerinden ilerleme bildirimi
        websocketService.sendMessage({
          type: 'downloadProgress',
          data: {
            songId: song._id,
            progress,
            downloadedSize: start + chunk.length,
            totalSize: fileSize,
            currentChunk: i + 1,
            totalChunks: chunks
          }
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
      
      // WebSocket üzerinden tamamlanma bildirimi
      websocketService.sendMessage({
        type: 'downloadProgress',
        data: {
          songId: song._id,
          status: 'completed',
          path: songPath
        }
      });

      return songPath;

    } catch (error) {
      this.logger.error(`Error downloading song ${song.name}:`, error);
      
      // WebSocket üzerinden hata bildirimi
      websocketService.sendMessage({
        type: 'downloadProgress',
        data: {
          songId: song._id,
          status: 'error',
          error: error.message
        }
      });

      if (fs.existsSync(tempSongPath)) {
        fs.unlinkSync(tempSongPath);
      }
      throw error;
    }
  }

  calculateChunkSize(fileSize) {
    if (fileSize < 10 * 1024 * 1024) return 256 * 1024; // 256KB
    if (fileSize < 100 * 1024 * 1024) return 1024 * 1024; // 1MB
    return 2 * 1024 * 1024; // 2MB
  }
}

module.exports = new ChunkDownloadManager();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const BaseDownloadManager = require('./BaseDownloadManager');
const downloadProgressService = require('../DownloadProgressService');
const ChecksumVerifier = require('../utils/ChecksumVerifier');
const bandwidthManager = require('../BandwidthManager');

class ChunkDownloadManager extends BaseDownloadManager {
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

      const chunk = await this._performChunkDownload(url, start, end, songId, downloadId);
      
      // İlerleme bilgisini güncelle
      downloadProgressService.updateProgress(playlistId, {
        songId,
        chunkId,
        size: chunk.length,
        status: 'completed'
      });

      bandwidthManager.finishDownload(downloadId);
      return chunk;

    } catch (error) {
      bandwidthManager.finishDownload(downloadId);
      downloadProgressService.handleError(playlistId, error);
      throw error;
    }
  }

  async downloadSong(song, baseUrl, playlistDir, playlistId) {
    this.logger.info(`Starting download for song: ${song.name}`);
    
    const songPath = path.join(playlistDir, `${song._id}.mp3`);
    const tempSongPath = `${songPath}.temp`;
    const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

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
        
        const chunk = await this.downloadChunk(songUrl, start, end, song._id, playlistId);
        writer.write(chunk);
      }

      await new Promise((resolve) => writer.end(resolve));
      
      if (song.checksum) {
        const isValid = await ChecksumVerifier.verifyFileChecksum(tempSongPath, song.checksum);
        if (!isValid) {
          throw new Error('Final checksum verification failed');
        }
      }

      fs.renameSync(tempSongPath, songPath);
      return songPath;

    } catch (error) {
      this.logger.error(`Error downloading song ${song.name}:`, error);
      if (fs.existsSync(tempSongPath)) {
        fs.unlinkSync(tempSongPath);
      }
      throw error;
    }
  }
}

module.exports = new ChunkDownloadManager();
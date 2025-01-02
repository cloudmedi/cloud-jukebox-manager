const axios = require('axios');
const fs = require('fs');
const path = require('path');
const BaseDownloadManager = require('./BaseDownloadManager');
const downloadProgressService = require('../DownloadProgressService');
const bandwidthManager = require('../BandwidthManager');

class ChunkDownloadManager extends BaseDownloadManager {
  async downloadChunk(url, start, end, songId, playlistId, retryCount = 0) {
    const chunkId = `${songId}-${start}`;
    const downloadId = `${songId}-${Date.now()}`;
    
    try {
      if (!bandwidthManager.startDownload(downloadId)) {
        console.log(`Download delayed due to bandwidth limits for chunk ${chunkId}`);
        return new Promise(resolve => setTimeout(() => resolve(
          this.downloadChunk(url, start, end, songId, playlistId, retryCount)
        ), 1000));
      }

      const chunk = await this._performChunkDownload(url, start, end, songId, downloadId);
      
      downloadProgressService.updateChunkProgress(playlistId, {
        songId,
        chunkId,
        size: chunk.length,
        status: 'completed'
      });

      bandwidthManager.finishDownload(downloadId);
      return chunk;

    } catch (error) {
      console.error(`Error downloading chunk ${chunkId}:`, error);
      bandwidthManager.finishDownload(downloadId);
      downloadProgressService.handleError(playlistId, error);
      throw error;
    }
  }

  async _performChunkDownload(url, start, end, songId, downloadId) {
    console.log(`Starting chunk download for song ${songId}, range: ${start}-${end}`);
    const startTime = Date.now();
    let downloadedBytes = 0;
    let lastLogTime = Date.now();

    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: { 
          Range: `bytes=${start}-${end}`
        },
        onDownloadProgress: async (progressEvent) => {
          const newBytes = progressEvent.loaded - downloadedBytes;
          downloadedBytes = progressEvent.loaded;
          
          await bandwidthManager.updateProgress(downloadId, newBytes);
          
          const now = Date.now();
          if (now - lastLogTime >= 1000) {
            const speed = (downloadedBytes / ((now - startTime) / 1000));
            console.log(`Download progress for chunk:`, {
              songId,
              chunkId: `${start}-${end}`,
              downloadedBytes: `${(downloadedBytes / (1024 * 1024)).toFixed(2)}MB`,
              speed: `${(speed / (1024 * 1024)).toFixed(2)}MB/s`
            });
            lastLogTime = now;
          }
        }
      });

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const speed = downloadedBytes / duration;

      console.log(`Chunk download completed:`, {
        songId,
        chunkSize: `${(downloadedBytes / (1024 * 1024)).toFixed(2)}MB`,
        duration: `${duration.toFixed(2)}s`,
        speed: `${(speed / (1024 * 1024)).toFixed(2)}MB/s`
      });

      return response.data;
    } catch (error) {
      console.error(`Error in _performChunkDownload:`, error);
      throw error;
    }
  }

  async downloadSong(song, baseUrl, playlistDir, isResume = false) {
    console.log(`Starting download for song: ${song.name}`);
    
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
        console.log(`Resuming download from byte ${startByte}`);
      }

      const chunks = Math.ceil((fileSize - startByte) / chunkSize);
      const writer = fs.createWriteStream(tempSongPath, { flags: startByte ? 'a' : 'w' });
      
      for (let i = 0; i < chunks; i++) {
        const start = startByte + (i * chunkSize);
        const end = Math.min(start + chunkSize - 1, fileSize - 1);
        
        const chunk = await this.downloadChunk(songUrl, start, end, song._id, playlistDir);
        writer.write(chunk);
      }

      await new Promise((resolve) => writer.end(resolve));
      
      fs.renameSync(tempSongPath, songPath);
      console.log(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      console.error(`Error downloading song ${song.name}:`, error);
      if (fs.existsSync(tempSongPath)) {
        fs.unlinkSync(tempSongPath);
      }
      throw error;
    }
  }
}

module.exports = new ChunkDownloadManager();
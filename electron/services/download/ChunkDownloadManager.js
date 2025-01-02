const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { createLogger } = require('../../utils/logger');
const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager {
  constructor() {
    this.activeDownloads = new Map();
    this.logger = createLogger('ChunkDownloadManager');
  }

  async downloadSong(song, baseUrl, downloadDir) {
    try {
      this.logger.info('[SONG DOWNLOAD] Starting', {
        name: song.name,
        songId: song._id,
        timestamp: new Date().toISOString()
      });

      const songPath = path.join(downloadDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      // Dosya zaten var mı kontrol et
      if (fs.existsSync(songPath)) {
        this.logger.info('[SONG DOWNLOAD] File already exists', {
          path: songPath,
          songId: song._id
        });
        return songPath;
      }

      const response = await axios({
        url: songUrl,
        method: 'GET',
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(songPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          this.logger.info('[SONG DOWNLOAD] Completed', {
            path: songPath,
            songId: song._id
          });
          resolve(songPath);
        });

        writer.on('error', (error) => {
          this.logger.error('[SONG DOWNLOAD] Error', {
            error: error.message,
            songId: song._id
          });
          reject(error);
        });
      });

    } catch (error) {
      this.logger.error('[SONG DOWNLOAD] Failed', {
        error: error.message,
        songId: song._id
      });
      throw error;
    }
  }

  queueSongDownload(song, baseUrl, downloadDir) {
    this.logger.info('[SONG QUEUE] Adding to queue', {
      name: song.name,
      songId: song._id
    });
    
    // Kuyruk mantığı burada implement edilecek
    this.downloadSong(song, baseUrl, downloadDir)
      .catch(error => {
        this.logger.error('[SONG QUEUE] Download failed', {
          error: error.message,
          songId: song._id
        });
      });
  }
}

module.exports = new ChunkDownloadManager();

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { EventEmitter } = require('events');
const downloadStateManager = require('./DownloadStateManager');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('chunk-download-manager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.chunkSize = 256 * 1024; // 256KB - daha küçük chunk'lar
    this.maxRetries = 3;
    this.activeDownloads = new Map();
    this.cancelTokens = new Map(); // Yeni: İndirmeleri iptal etmek için
    this.concurrentDownloads = 1; // Tek seferde 1 chunk
    this.chunkDelay = 500; // Her chunk arası 500ms bekleme
  }

  // Yeni: Playlist'in indirmelerini durdur
  async stopPlaylistDownloads(playlistId) {
    logger.info(`Stopping downloads for playlist: ${playlistId}`);
    
    // Bu playlist'e ait tüm indirmeleri bul
    const downloads = Array.from(this.activeDownloads.entries())
      .filter(([key]) => key.startsWith(`${playlistId}:`));
    
    // İndirmeleri durdur
    downloads.forEach(([key, controller]) => {
      controller.abort();
      this.activeDownloads.delete(key);
    });

    // Biraz bekle (dosyaların kapanması için)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    logger.info(`Stopped all downloads for playlist: ${playlistId}`);
  }

  async downloadSong(song, baseUrl, playlistId) {
    const downloadKey = `${playlistId}:${song._id}`;
    
    try {
      const url = `${baseUrl}/${song.filePath}`;
      const finalPath = path.join(
        downloadStateManager.baseDownloadPath,
        playlistId,
        `${song._id}.mp3`
      );

      // Şarkı zaten var mı kontrol et
      if (await this.isFileComplete(finalPath)) {
        downloadStateManager.completeSongDownload(playlistId, song._id, finalPath);
        return finalPath;
      }

      // Yeni: AbortController oluştur
      const controller = new AbortController();
      this.activeDownloads.set(downloadKey, controller);

      // Chunk'lara böl ve indir
      const chunks = await this.downloadChunks(url, song._id, playlistId, controller.signal);
      
      // İndirme tamamlandı, Map'ten kaldır
      this.activeDownloads.delete(downloadKey);
      
      // Chunk'ları birleştir
      await this.mergeChunks(chunks, finalPath);
      
      // Tamamlandı olarak işaretle
      downloadStateManager.completeSongDownload(playlistId, song._id, finalPath);
      
      return finalPath;
    } catch (error) {
      // Eğer iptal edildiyse hata fırlatma
      if (error.name === 'AbortError') {
        logger.info(`Download cancelled for song: ${song._id}`);
        return null;
      }
      
      downloadStateManager.handleDownloadError(playlistId, song._id, error);
      throw error;
    } finally {
      this.activeDownloads.delete(downloadKey);
    }
  }

  async downloadChunks(url, songId, playlistId, signal) {
    const chunks = [];
    let start = 0;

    try {
      const headResponse = await axios.head(url);
      const totalSize = parseInt(headResponse.headers['content-length'], 10);
      
      logger.info(`Starting download for song ${songId} in playlist ${playlistId}. Total size: ${totalSize} bytes`);

      // Dosya boyutunu al
      while (start < totalSize) {
        const end = Math.min(start + this.chunkSize - 1, totalSize - 1);
        
        try {
          const chunk = await this.downloadChunk(url, start, end, songId, playlistId, signal);
          if (!chunk) break;

          chunks.push(chunk);
          start += chunk.data.length;

          // Sadece log at, WebSocket mesajı gönderme
          const progress = Math.min(100, (start / totalSize) * 100);
          logger.info(`Download progress for song ${songId}: ${progress.toFixed(2)}% (${start}/${totalSize} bytes)`);
          
          // Durumu güncelle ama mesaj gönderme
          downloadStateManager.updateSongStateWithoutMessage(playlistId, songId, { 
            progress,
            downloadedBytes: start,
            totalBytes: totalSize,
            status: 'downloading'
          });

          await new Promise(resolve => setTimeout(resolve, this.chunkDelay));
        } catch (error) {
          if (error.name === 'AbortError') throw error;
          logger.warn(`Chunk download failed for ${url} at bytes ${start}-${end}, retrying...`);
        }
      }

      return chunks;
    } catch (error) {
      logger.error(`Failed to download file ${url}: ${error.message}`);
      throw error;
    }
  }

  async downloadChunk(url, start, end, songId, playlistId, signal, retryCount = 0) {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: { Range: `bytes=${start}-${end}` },
        timeout: 30000,
        signal // Yeni: İptal sinyalini ekle
      });

      const chunk = {
        data: response.data,
        start,
        end: start + response.data.length - 1
      };

      // Chunk'ı kaydet
      const chunkState = downloadStateManager.saveChunkState(playlistId, songId, chunk);
      
      // Chunk'ı diske kaydet
      await this.saveChunkToDisk(chunk, chunkState);
      
      return chunk;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error; // İptal sinyalini yukarı ilet
      }
      
      if (retryCount < this.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        return this.downloadChunk(url, start, end, songId, playlistId, signal, retryCount + 1);
      }
      throw error;
    }
  }

  async saveChunkToDisk(chunk, chunkState) {
    const chunkPath = downloadStateManager.getChunkPath(
      chunkState.playlistId,
      chunkState.songId,
      chunkState.id
    );

    await fs.ensureDir(path.dirname(chunkPath));
    await fs.writeFile(chunkPath, chunk.data);
  }

  async isFileComplete(filePath) {
    try {
      await fs.access(filePath);
      const stats = await fs.stat(filePath);
      return stats.size > 0;
    } catch {
      return false;
    }
  }

  async mergeChunks(chunks, finalPath) {
    await fs.ensureDir(path.dirname(finalPath));
    const writeStream = fs.createWriteStream(finalPath);
    
    for (const chunk of chunks) {
      await new Promise((resolve, reject) => {
        writeStream.write(chunk.data, error => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await new Promise(resolve => writeStream.end(resolve));
  }
}

module.exports = new ChunkDownloadManager();

const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const downloadWorker = require('./DownloadWorker');
const checksumManager = require('./ChecksumManager');
const chunkSizeManager = require('./ChunkSizeManager');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.MAX_CONCURRENT_DOWNLOADS = 3; // Maximum 3 eşzamanlı şarkı indirme
    this.MAX_CHUNK_SPEED = 2 * 1024 * 1024; // 2MB/s maximum chunk hızı
    this.BUFFER_SIZE = 5 * 1024 * 1024; // 5MB buffer
    this.MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB max memory
    this.downloadQueue = [];
    this.chunkBuffers = new Map();
    this.downloadedChunks = new Map();
    this.memoryUsage = 0;
    this.checksums = new Map();
    this.activeDownloads = new Set();

    // Bellek temizleme için interval
    setInterval(() => this.cleanupMemory(), 30000);
  }

  getMemoryUsage() {
    return this.memoryUsage;
  }

  trackMemoryUsage(size, operation = 'add') {
    if (operation === 'add') {
      this.memoryUsage += size;
    } else {
      this.memoryUsage -= size;
    }
    
    if (this.memoryUsage > this.MAX_MEMORY_USAGE) {
      console.warn('High memory usage detected:', this.memoryUsage);
      this.emit('high-memory-usage', this.memoryUsage);
      this.cleanupMemory(true);
    }
  }

  cleanupMemory(force = false) {
    console.log('Running memory cleanup...');
    
    for (const [songId, chunks] of this.downloadedChunks.entries()) {
      if (force || this.isDownloadComplete(songId)) {
        const totalSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        this.trackMemoryUsage(totalSize, 'subtract');
        this.downloadedChunks.delete(songId);
        this.chunkBuffers.delete(songId);
        this.checksums.delete(songId);
        console.log(`Cleaned up chunks for song: ${songId}`);
      }
    }
  }

  isDownloadComplete(songId) {
    return !this.activeDownloads.has(songId);
  }

  async downloadSongInChunks(song, baseUrl, playlistDir) {
    try {
      console.log(`Starting chunked download for song: ${song.name}`);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      // İndirme başlangıç zamanı
      const startTime = Date.now();
      this.activeDownloads.add(song._id);

      // İlk chunk'ı indir
      const firstChunkSize = chunkSizeManager.getCurrentChunkSize();
      const firstChunkResult = await downloadWorker.downloadChunk(
        songUrl,
        0,
        firstChunkSize - 1,
        this.MAX_CHUNK_SPEED
      );

      this.trackMemoryUsage(firstChunkResult.data.length, 'add');
      this.downloadedChunks.set(song._id, [firstChunkResult.data]);
      this.checksums.set(song._id, [firstChunkResult.checksum]);

      fs.writeFileSync(songPath, Buffer.from(firstChunkResult.data));
      
      // İlk chunk hazır eventi
      this.emit('firstChunkReady', {
        songId: song._id,
        songPath,
        buffer: firstChunkResult.data
      });

      const response = await axios.head(songUrl);
      const fileSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = firstChunkSize;
      
      while (downloadedSize < fileSize) {
        const chunkSize = chunkSizeManager.getCurrentChunkSize();
        const end = Math.min(downloadedSize + chunkSize - 1, fileSize - 1);
        
        try {
          const chunkResult = await downloadWorker.downloadChunk(
            songUrl, 
            downloadedSize, 
            end,
            this.MAX_CHUNK_SPEED
          );
          
          this.trackMemoryUsage(chunkResult.data.length, 'add');
          this.downloadedChunks.get(song._id).push(chunkResult.data);
          this.checksums.get(song._id).push(chunkResult.checksum);
          
          fs.appendFileSync(songPath, Buffer.from(chunkResult.data));

          downloadedSize += chunkResult.data.length;
          const progress = Math.floor(downloadedSize / fileSize * 100);
          
          // İndirme hızını hesapla ve chunk boyutunu ayarla
          const currentTime = Date.now();
          const elapsedTime = (currentTime - startTime) / 1000; // saniye cinsinden
          const downloadSpeed = downloadedSize / elapsedTime; // bytes/second
          chunkSizeManager.adjustChunkSize(chunkResult.data.length, elapsedTime);

          this.emit('progress', {
            songId: song._id,
            progress,
            speed: downloadSpeed,
            isComplete: progress === 100
          });

        } catch (error) {
          console.error(`Error downloading chunk for ${song.name}:`, error);
          throw error;
        }
      }

      // Final dosya doğrulaması
      const finalChecksum = await checksumManager.calculateFileChecksum(songPath);
      const allChunksChecksum = this.checksums.get(song._id).join('');
      
      if (finalChecksum !== allChunksChecksum) {
        throw new Error('Final file verification failed');
      }

      this.activeDownloads.delete(song._id);
      this.cleanupDownload(song._id);
      
      console.log(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      this.activeDownloads.delete(song._id);
      console.error(`Error in chunked download for ${song.name}:`, error);
      throw error;
    }
  }

  cleanupDownload(songId) {
    this.downloadedChunks.delete(songId);
    this.checksums.delete(songId);
    this.chunkBuffers.delete(songId);
    this.activeDownloads.delete(songId);
  }

  addToQueue(song, baseUrl, playlistDir) {
    // Düşük öncelikli arka plan indirmesi için process.nextTick kullan
    process.nextTick(() => {
      this.downloadQueue.push({ song, baseUrl, playlistDir });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.downloadQueue.length === 0) return;

    // Maximum eşzamanlı indirme kontrolü
    while (
      this.downloadQueue.length > 0 && 
      this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS
    ) {
      const download = this.downloadQueue.shift();
      if (download) {
        try {
          await this.downloadSongInChunks(
            download.song,
            download.baseUrl,
            download.playlistDir
          );
        } catch (error) {
          console.error(`Error processing download for ${download.song.name}:`, error);
          // Hata durumunda kuyruğun devam etmesini sağla
          continue;
        }
      }
    }
  }
}

module.exports = new ChunkDownloadManager();
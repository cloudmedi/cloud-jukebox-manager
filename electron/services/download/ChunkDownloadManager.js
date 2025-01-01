const { EventEmitter } = require('events');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ChunkDownloadManager extends EventEmitter {
  constructor() {
    super();
    this.CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    this.MAX_CONCURRENT_DOWNLOADS = 10;
    this.BUFFER_SIZE = 5 * 1024 * 1024; // 5MB buffer
    this.MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB max memory
    this.activeDownloads = new Map();
    this.downloadQueue = [];
    this.chunkBuffers = new Map();
    this.downloadedChunks = new Map();
    this.memoryUsage = 0;

    // Her 30 saniyede bir bellek temizliği yap
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
    
    // Bellek kullanımı çok yüksekse uyarı yayınla
    if (this.memoryUsage > this.MAX_MEMORY_USAGE) {
      console.warn('High memory usage detected:', this.memoryUsage);
      this.emit('high-memory-usage', this.memoryUsage);
      this.cleanupMemory(true); // Force cleanup
    }
  }

  cleanupMemory(force = false) {
    console.log('Running memory cleanup...');
    
    // Tamamlanmış indirmelerin chunk'larını temizle
    for (const [songId, chunks] of this.downloadedChunks.entries()) {
      if (force || this.isDownloadComplete(songId)) {
        const totalSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        this.trackMemoryUsage(totalSize, 'subtract');
        this.downloadedChunks.delete(songId);
        this.chunkBuffers.delete(songId);
        console.log(`Cleaned up chunks for song: ${songId}`);
      }
    }

    // Aktif olmayan indirmeleri temizle
    for (const [songId, download] of this.activeDownloads.entries()) {
      if (!download.isActive && (force || Date.now() - download.lastActive > 300000)) {
        this.activeDownloads.delete(songId);
        console.log(`Cleaned up inactive download: ${songId}`);
      }
    }
  }

  isDownloadComplete(songId) {
    const chunks = this.downloadedChunks.get(songId);
    if (!chunks) return false;
    
    const download = this.activeDownloads.get(songId);
    if (!download) return true;
    
    return download.totalChunks === chunks.length;
  }

  async downloadSongInChunks(song, baseUrl, playlistDir) {
    try {
      console.log(`Starting chunked download for song: ${song.name}`);
      
      const songPath = path.join(playlistDir, `${song._id}.mp3`);
      const songUrl = `${baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

      // İlk chunk'ı hemen indir ve oynatmaya başla
      const firstChunkSize = 1024 * 1024; // 1MB
      const firstChunkResponse = await axios({
        url: songUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: {
          Range: `bytes=0-${firstChunkSize - 1}`
        }
      });

      // İlk chunk'ı belleğe kaydet ve takip et
      this.trackMemoryUsage(firstChunkResponse.data.length, 'add');
      if (!this.downloadedChunks.has(song._id)) {
        this.downloadedChunks.set(song._id, []);
      }
      this.downloadedChunks.get(song._id).push(firstChunkResponse.data);

      // İlk chunk'ı dosyaya yaz
      fs.writeFileSync(songPath, Buffer.from(firstChunkResponse.data));
      
      // İlk chunk hazır eventi
      console.log(`First chunk ready for ${song.name}, emitting event`);
      this.emit('firstChunkReady', {
        songId: song._id,
        songPath,
        buffer: firstChunkResponse.data
      });

      // Geri kalan dosyayı arka planda indir
      const response = await axios.head(songUrl);
      const fileSize = parseInt(response.headers['content-length'], 10);
      const totalChunks = Math.ceil(fileSize / this.CHUNK_SIZE);
      
      // Aktif indirmeyi kaydet
      this.activeDownloads.set(song._id, {
        isActive: true,
        lastActive: Date.now(),
        totalChunks
      });
      
      // İlk chunk sonrası kalan chunk'ları indir
      for (let start = firstChunkSize; start < fileSize; start += this.CHUNK_SIZE) {
        const end = Math.min(start + this.CHUNK_SIZE - 1, fileSize - 1);
        
        try {
          const chunk = await this.downloadChunk(songUrl, start, end);
          
          // Chunk'ı belleğe kaydet ve takip et
          this.trackMemoryUsage(chunk.length, 'add');
          this.downloadedChunks.get(song._id).push(chunk);
          
          // Chunk'ı dosyaya ekle
          fs.appendFileSync(songPath, Buffer.from(chunk));

          // İndirme durumunu güncelle
          const download = this.activeDownloads.get(song._id);
          if (download) {
            download.lastActive = Date.now();
          }

          // İndirme durumunu bildir
          const progress = Math.floor((start + chunk.length) / fileSize * 100);
          this.emit('progress', {
            songId: song._id,
            progress,
            isComplete: progress === 100
          });

        } catch (error) {
          console.error(`Error downloading chunk for ${song.name}:`, error);
          throw error;
        }
      }

      // İndirme tamamlandı, aktif indirmeyi güncelle
      const download = this.activeDownloads.get(song._id);
      if (download) {
        download.isActive = false;
      }

      console.log(`Download completed for ${song.name}`);
      return songPath;

    } catch (error) {
      console.error(`Error in chunked download for ${song.name}:`, error);
      throw error;
    }
  }

  async downloadChunk(url, start, end) {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: {
          Range: `bytes=${start}-${end}`
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      console.error('Error downloading chunk:', error);
      throw error;
    }
  }

  addToQueue(song, baseUrl, playlistDir) {
    this.downloadQueue.push({ song, baseUrl, playlistDir });
    this.processQueue();
  }

  async processQueue() {
    if (this.downloadQueue.length === 0) return;

    while (
      this.activeDownloads.size < this.MAX_CONCURRENT_DOWNLOADS && 
      this.downloadQueue.length > 0
    ) {
      const download = this.downloadQueue.shift();
      if (download) {
        this.activeDownloads.set(download.song._id, download);
        
        try {
          await this.downloadSongInChunks(
            download.song,
            download.baseUrl,
            download.playlistDir
          );
        } finally {
          this.activeDownloads.delete(download.song._id);
          this.processQueue();
        }
      }
    }
  }
}

module.exports = new ChunkDownloadManager();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const Store = require('electron-store');
const store = new Store();

class ProgressiveDownloader {
  constructor() {
    this.downloadQueue = [];
    this.currentDownloads = new Map();
    this.priorityQueue = new Set();
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
  }

  async startPlaylistDownload(playlist, onFirstSongReady) {
    console.log('Starting progressive download for playlist:', playlist.name);
    
    // İlk 3 şarkıyı öncelikli olarak indir
    const prioritySongs = playlist.songs.slice(0, 3);
    const remainingSongs = playlist.songs.slice(3);

    // İlk şarkıyı indir ve hazır olduğunda callback'i çağır
    if (prioritySongs.length > 0) {
      const firstSong = prioritySongs[0];
      try {
        const songPath = await this.downloadSong(firstSong, playlist.baseUrl);
        onFirstSongReady({ ...firstSong, localPath: songPath });
        
        // Diğer öncelikli şarkıları indir
        for (const song of prioritySongs.slice(1)) {
          this.priorityQueue.add(song);
          this.downloadSong(song, playlist.baseUrl);
        }
      } catch (error) {
        console.error('Error downloading first song:', error);
      }
    }

    // Kalan şarkıları arka planda indir
    for (const song of remainingSongs) {
      this.downloadQueue.push({ song, baseUrl: playlist.baseUrl });
    }

    this.processQueue();
  }

  async downloadSong(song, baseUrl) {
    const songPath = path.join(this.downloadPath, `${song._id}.mp3`);

    // Şarkı zaten indirilmişse, direkt döndür
    if (fs.existsSync(songPath)) {
      console.log('Song already exists:', song.name);
      return songPath;
    }

    console.log('Downloading song:', song.name);

    try {
      const response = await axios({
        url: `${baseUrl}/${song.filePath}`,
        method: 'GET',
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(songPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log('Song downloaded successfully:', song.name);
          resolve(songPath);
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading song:', error);
      throw error;
    }
  }

  processQueue() {
    // Önce öncelikli kuyruktaki şarkıları işle
    for (const song of this.priorityQueue) {
      if (!this.currentDownloads.has(song._id)) {
        this.downloadSong(song.song, song.baseUrl);
      }
    }

    // Sonra normal kuyruğu işle
    while (this.downloadQueue.length > 0 && this.currentDownloads.size < 3) {
      const { song, baseUrl } = this.downloadQueue.shift();
      if (!this.currentDownloads.has(song._id)) {
        this.downloadSong(song, baseUrl);
      }
    }
  }

  cancelDownloads() {
    console.log('Cancelling all downloads');
    this.downloadQueue = [];
    this.priorityQueue.clear();
    // Mevcut indirmeleri iptal et
    for (const [songId, controller] of this.currentDownloads) {
      controller.abort();
    }
    this.currentDownloads.clear();
  }
}

module.exports = new ProgressiveDownloader();
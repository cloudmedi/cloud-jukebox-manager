const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { app } = require('electron');

class ArtworkManager {
  constructor() {
    this.artworkDir = path.join(app.getPath('userData'), 'artworks');
    this.ensureArtworkDirectory();
    this.artworkCache = new Map();
  }

  ensureArtworkDirectory() {
    if (!fs.existsSync(this.artworkDir)) {
      fs.mkdirSync(this.artworkDir, { recursive: true });
    }
  }

  async downloadArtwork(artworkUrl, playlistId) {
    try {
      // Önbellekte varsa onu döndür
      if (this.artworkCache.has(playlistId)) {
        return this.artworkCache.get(playlistId);
      }

      const artworkPath = path.join(this.artworkDir, `${playlistId}.jpg`);
      
      // Dosya zaten varsa onu döndür
      if (fs.existsSync(artworkPath)) {
        this.artworkCache.set(playlistId, artworkPath);
        return artworkPath;
      }

      // Artwork URL'sini düzelt
      const fullUrl = artworkUrl.startsWith('http') 
        ? artworkUrl 
        : `http://localhost:5000${artworkUrl}`;

      // Artwork'ü indir
      const response = await axios({
        url: fullUrl,
        method: 'GET',
        responseType: 'stream'
      });

      // Dosyaya kaydet
      const writer = fs.createWriteStream(artworkPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          this.artworkCache.set(playlistId, artworkPath);
          resolve(artworkPath);
        });
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Artwork indirme hatası:', error);
      return null;
    }
  }

  clearCache() {
    this.artworkCache.clear();
  }
}

module.exports = new ArtworkManager();
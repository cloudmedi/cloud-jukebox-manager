const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class ArtworkManager {
  constructor() {
    this.artworkDir = path.join(app.getPath('userData'), 'artworks');
    this.ensureArtworkDirectory();
  }

  ensureArtworkDirectory() {
    if (!fs.existsSync(this.artworkDir)) {
      fs.mkdirSync(this.artworkDir, { recursive: true });
    }
  }

  getArtworkPath(artworkUrl) {
    if (!artworkUrl) return null;

    // Eğer artwork zaten yerel bir dosya ise
    if (artworkUrl.startsWith(this.artworkDir)) {
      return artworkUrl;
    }

    // Server'dan gelen artwork URL'ini yerel dosya sistemine çevir
    const filename = path.basename(artworkUrl);
    return path.join(this.artworkDir, filename);
  }

  async saveArtwork(artworkUrl) {
    if (!artworkUrl) return null;

    try {
      const localPath = this.getArtworkPath(artworkUrl);
      
      // Eğer artwork zaten indirilmişse
      if (fs.existsSync(localPath)) {
        return localPath;
      }

      // Artwork'ü indir
      const response = await fetch(`http://localhost:5000${artworkUrl}`);
      const buffer = await response.arrayBuffer();
      
      fs.writeFileSync(localPath, Buffer.from(buffer));
      console.log('Artwork saved:', localPath);
      
      return localPath;
    } catch (error) {
      console.error('Error saving artwork:', error);
      return null;
    }
  }
}

module.exports = new ArtworkManager();
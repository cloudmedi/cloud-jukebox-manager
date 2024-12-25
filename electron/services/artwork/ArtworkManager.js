const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class ArtworkManager {
  constructor() {
    this.artworkPath = path.join(app.getPath('userData'), 'artworks');
    this.ensureArtworkDirectory();
  }

  ensureArtworkDirectory() {
    if (!fs.existsSync(this.artworkPath)) {
      fs.mkdirSync(this.artworkPath, { recursive: true });
    }
  }

  getArtworkPath(filename) {
    return path.join(this.artworkPath, filename);
  }

  saveArtwork(artworkUrl, playlistId) {
    if (!artworkUrl) return null;
    
    const extension = path.extname(artworkUrl) || '.jpg';
    const artworkFilename = `playlist-${playlistId}${extension}`;
    const localPath = this.getArtworkPath(artworkFilename);

    try {
      // URL'den gelen artwork'ü lokale kaydet
      const artworkData = fs.readFileSync(artworkUrl);
      fs.writeFileSync(localPath, artworkData);
      return `file://${localPath}`;
    } catch (error) {
      console.error('Artwork kaydetme hatası:', error);
      return null;
    }
  }

  cleanupOldArtworks(exceptPlaylistId) {
    try {
      const files = fs.readdirSync(this.artworkPath);
      files.forEach(file => {
        if (!file.includes(exceptPlaylistId)) {
          fs.unlinkSync(path.join(this.artworkPath, file));
        }
      });
    } catch (error) {
      console.error('Artwork temizleme hatası:', error);
    }
  }
}

module.exports = new ArtworkManager();
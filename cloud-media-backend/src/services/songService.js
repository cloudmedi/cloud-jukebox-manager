const NodeID3 = require('node-id3');
const fs = require('fs');
const path = require('path');
const Song = require('../models/Song');

const handleFileUpload = async (file) => {
  try {
    // ID3 etiketlerini oku
    const tags = NodeID3.read(file.path);
    
    // Metadata'dan bilgileri al
    const artist = tags.artist || 'Bilinmeyen Sanatçı';
    const title = tags.title || file.originalname;
    const album = tags.album || '';
    const genre = tags.genre || 'Other';
    const year = tags.year ? parseInt(tags.year) : null;
    
    // Artwork'ü kaydet
    let artworkPath = null;
    if (tags.image && tags.image.imageBuffer) {
      // Artwork klasörünü oluştur
      const artworkDir = path.join('uploads', 'artworks');
      if (!fs.existsSync(artworkDir)) {
        fs.mkdirSync(artworkDir, { recursive: true });
      }
      
      const artworkFileName = `artwork-${Date.now()}.jpg`;
      const artworkFullPath = path.join(artworkDir, artworkFileName);
      
      fs.writeFileSync(artworkFullPath, tags.image.imageBuffer);
      artworkPath = `/uploads/artworks/${artworkFileName}`;
    }
    
    // Varsayılan süre
    const duration = 0;

    const song = new Song({
      name: title,
      artist: artist,
      genre: genre,
      album: album,
      year: year,
      filePath: file.path,
      artwork: artworkPath,
      duration: duration,
      createdBy: 'system'
    });

    return await song.save();
  } catch (error) {
    throw error;
  }
};

module.exports = {
  handleFileUpload
};
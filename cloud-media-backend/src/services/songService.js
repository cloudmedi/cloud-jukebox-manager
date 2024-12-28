const { parseFile } = require('music-metadata');
const fs = require('fs');
const path = require('path');
const Song = require('../models/Song');
const { createLogger } = require('../utils/logger');

const logger = createLogger('song-service');

const handleFileUpload = async (file) => {
  try {
    logger.info(`Processing uploaded file: ${file.originalname}`);
    
    // Metadata'yı oku
    const metadata = await parseFile(file.path);
    logger.info('Metadata parsed successfully');

    // Temel bilgileri al
    const title = metadata.common.title || path.parse(file.originalname).name;
    const artist = metadata.common.artist || 'Bilinmeyen Sanatçı';
    const album = metadata.common.album || '';
    const genre = metadata.common.genre?.[0] || 'Other';
    const year = metadata.common.year || null;
    
    // Süreyi saniye cinsinden al ve yuvarla
    const duration = Math.round(metadata.format.duration || 0);

    // Artwork'ü kaydet
    let artworkPath = null;
    if (metadata.common.picture && metadata.common.picture[0]) {
      const picture = metadata.common.picture[0];
      const artworkDir = path.join('uploads', 'artworks');
      
      // Artwork klasörünü oluştur
      if (!fs.existsSync(artworkDir)) {
        fs.mkdirSync(artworkDir, { recursive: true });
      }
      
      const artworkFileName = `artwork-${Date.now()}.${picture.format.split('/')[1]}`;
      const artworkFullPath = path.join(artworkDir, artworkFileName);
      
      fs.writeFileSync(artworkFullPath, picture.data);
      artworkPath = `/uploads/artworks/${artworkFileName}`;
      logger.info(`Artwork saved: ${artworkPath}`);
    }

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

    logger.info('Song document created, saving to database');
    return await song.save();
  } catch (error) {
    logger.error('Error in handleFileUpload:', error);
    throw error;
  }
};

module.exports = {
  handleFileUpload
};
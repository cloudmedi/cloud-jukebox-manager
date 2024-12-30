const fs = require('fs');
const path = require('path');
const Song = require('../models/Song');
const { createLogger } = require('../utils/logger');

const logger = createLogger('song-service');

const handleFileUpload = async (file) => {
  try {
    logger.info(`Processing uploaded file: ${file.originalname}`);
    
    // Dynamic import music-metadata
    const { parseFile } = await import('music-metadata');
    
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

    const song = new Song({
      name: title,
      artist: artist,
      genre: genre,
      album: album,
      year: year,
      filePath: file.path,
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
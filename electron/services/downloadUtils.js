const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const getDownloadPath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'downloads');
};

const downloadFile = async (url, filePath, onProgress) => {
  try {
    console.log('Downloading file:', url);
    const downloadPath = path.dirname(filePath);
    ensureDirectoryExists(downloadPath);

    const writer = fs.createWriteStream(filePath);

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    const totalLength = response.headers['content-length'];
    console.log('Total file size:', totalLength);

    let downloaded = 0;
    response.data.on('data', (chunk) => {
      downloaded += chunk.length;
      const progress = Math.round((downloaded * 100) / totalLength);
      if (onProgress) {
        onProgress(progress);
      }
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log('Download completed:', filePath);
        resolve(filePath);
      });
      writer.on('error', (err) => {
        console.error('Download error:', err);
        reject(err);
      });
    });
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

// Yeni: Artwork indirme fonksiyonu
const downloadArtwork = async (artworkUrl, playlistId) => {
  try {
    if (!artworkUrl) {
      console.log('No artwork URL provided');
      return null;
    }

    const downloadPath = getDownloadPath();
    const artworkDir = path.join(downloadPath, 'artworks');
    ensureDirectoryExists(artworkDir);

    const artworkPath = path.join(artworkDir, `${playlistId}_artwork.jpg`);
    
    // Eğer artwork zaten indirilmişse, cached versiyonu kullan
    if (fs.existsSync(artworkPath)) {
      console.log('Using cached artwork:', artworkPath);
      return artworkPath;
    }

    console.log('Downloading artwork:', artworkUrl);
    await downloadFile(artworkUrl, artworkPath);
    console.log('Artwork downloaded successfully:', artworkPath);
    
    return artworkPath;
  } catch (error) {
    console.error('Artwork download failed:', error);
    return null;
  }
};

module.exports = {
  downloadFile,
  getDownloadPath,
  ensureDirectoryExists,
  downloadArtwork
};
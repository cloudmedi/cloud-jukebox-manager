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

module.exports = {
  downloadFile,
  getDownloadPath,
  ensureDirectoryExists
};
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const createFullUrl = (baseUrl, filePath) => {
  // Windows tarzı dosya yollarını URL formatına dönüştür
  const normalizedPath = filePath.replace(/\\/g, '/');
  return `${baseUrl}/${normalizedPath}`;
};

const downloadFile = async (url, filePath, onProgress) => {
  const dir = path.dirname(filePath);
  ensureDirectoryExists(dir);

  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    onDownloadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(progress);
      }
    }
  });

  const writer = fs.createWriteStream(filePath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};

module.exports = {
  ensureDirectoryExists,
  createFullUrl,
  downloadFile
};
const fs = require('fs');
const axios = require('axios');

const downloadFile = async (url, filePath, onProgress) => {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(filePath);
  const totalLength = response.headers['content-length'];

  console.log('Starting download:', url);
  console.log('Total size:', totalLength);

  response.data.pipe(writer);

  if (onProgress && totalLength) {
    let downloaded = 0;
    response.data.on('data', (chunk) => {
      downloaded += chunk.length;
      const progress = Math.round((downloaded * 100) / totalLength);
      onProgress(progress);
    });
  }

  return new Promise((resolve, reject) => {
    writer.on('finish', () => {
      console.log('Download completed:', filePath);
      resolve();
    });
    writer.on('error', (err) => {
      console.error('Download error:', err);
      reject(err);
    });
  });
};

module.exports = {
  downloadFile
};
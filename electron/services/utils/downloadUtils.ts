import axios from 'axios';
import fs from 'fs';
import path from 'path';

export const ensureDirectoryExists = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

export const createFullUrl = (baseUrl: string, filePath: string) => {
  // Windows tarzı dosya yollarını URL formatına dönüştür
  const normalizedPath = filePath.replace(/\\/g, '/');
  return `${baseUrl}/${normalizedPath}`;
};

export const downloadFile = async (
  url: string, 
  filePath: string, 
  onProgress?: (progress: number) => void
): Promise<void> => {
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
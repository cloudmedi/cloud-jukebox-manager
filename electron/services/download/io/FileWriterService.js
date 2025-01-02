const fs = require('fs');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('file-writer-service');

class FileWriterService {
  constructor() {
    this.activeWriters = new Map();
  }

  async writeChunk(filePath, chunk, append = false) {
    return new Promise((resolve, reject) => {
      try {
        const writer = fs.createWriteStream(filePath, { flags: append ? 'a' : 'w' });
        
        writer.write(chunk, (error) => {
          if (error) {
            logger.error(`Error writing chunk to ${filePath}:`, error);
            reject(error);
          } else {
            resolve();
          }
        });

        writer.on('error', (error) => {
          logger.error(`Stream error for ${filePath}:`, error);
          reject(error);
        });
      } catch (error) {
        logger.error(`Error creating write stream for ${filePath}:`, error);
        reject(error);
      }
    });
  }

  async moveFile(tempPath, finalPath) {
    try {
      fs.renameSync(tempPath, finalPath);
      logger.info(`Successfully moved file from ${tempPath} to ${finalPath}`);
      return true;
    } catch (error) {
      logger.error(`Error moving file from ${tempPath} to ${finalPath}:`, error);
      return false;
    }
  }

  cleanup(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Error cleaning up file ${filePath}:`, error);
    }
  }
}

module.exports = new FileWriterService();
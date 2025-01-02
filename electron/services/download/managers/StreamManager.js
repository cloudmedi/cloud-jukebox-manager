const fs = require('fs');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('stream-manager');

class StreamManager {
  createFileStream(filePath) {
    logger.info(`Creating write stream for: ${filePath}`);
    return fs.createWriteStream(filePath);
  }

  async writeChunkToStream(stream, chunk) {
    if (!chunk) {
      throw new Error('Cannot write null chunk to stream');
    }

    return new Promise((resolve, reject) => {
      const canContinue = stream.write(chunk);
      
      if (!canContinue) {
        stream.once('drain', resolve);
      } else {
        resolve();
      }

      stream.once('error', reject);
    });
  }

  async closeStream(stream) {
    return new Promise((resolve, reject) => {
      stream.end(err => {
        if (err) {
          logger.error('Error closing stream:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = new StreamManager();
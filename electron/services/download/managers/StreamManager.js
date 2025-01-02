const { createWriteStream } = require('fs');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('stream-manager');

class StreamManager {
  createFileStream(filePath) {
    return createWriteStream(filePath);
  }

  async writeChunkToStream(stream, chunk) {
    if (!chunk) {
      logger.error('Attempted to write null chunk to stream');
      throw new Error('Cannot write null chunk to stream');
    }

    return new Promise((resolve, reject) => {
      const canContinue = stream.write(chunk);
      
      if (!canContinue) {
        stream.once('drain', resolve);
      } else {
        resolve();
      }
    });
  }

  closeStream(stream) {
    return new Promise((resolve, reject) => {
      stream.end(err => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

module.exports = new StreamManager();
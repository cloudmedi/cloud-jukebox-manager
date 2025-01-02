const crypto = require('crypto');
const fs = require('fs');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('checksum-verifier');

class ChecksumVerifier {
  static calculateChunkChecksum(chunk) {
    try {
      return crypto
        .createHash('md5')
        .update(chunk)
        .digest('hex');
    } catch (error) {
      logger.error('Chunk checksum calculation error:', error);
      throw error;
    }
  }

  static calculateFileChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  static async verifyChunkChecksum(chunk, expectedChecksum) {
    try {
      const calculatedChecksum = this.calculateChunkChecksum(chunk);
      return calculatedChecksum === expectedChecksum;
    } catch (error) {
      logger.error('Chunk verification error:', error);
      return false;
    }
  }

  static async verifyFileChecksum(filePath, expectedChecksum) {
    try {
      const calculatedChecksum = await this.calculateFileChecksum(filePath);
      return calculatedChecksum === expectedChecksum;
    } catch (error) {
      logger.error('File checksum verification error:', error);
      return false;
    }
  }
}

module.exports = ChecksumVerifier;
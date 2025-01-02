const crypto = require('crypto');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('checksum-verifier');

class ChecksumVerifier {
  static calculateChunkChecksum(chunk) {
    try {
      return crypto
        .createHash('sha256')
        .update(chunk)
        .digest('hex');
    } catch (error) {
      logger.error('Chunk checksum calculation error:', error);
      throw error;
    }
  }

  static async verifyChunkChecksum(chunk, expectedChecksum) {
    try {
      const calculatedChecksum = this.calculateChunkChecksum(chunk);
      const isValid = calculatedChecksum === expectedChecksum;
      
      if (!isValid) {
        logger.warn('Chunk checksum verification failed', {
          expected: expectedChecksum,
          calculated: calculatedChecksum
        });
      }
      
      return isValid;
    } catch (error) {
      logger.error('Chunk verification error:', error);
      return false;
    }
  }

  static async calculateFileChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = require('fs').createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
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
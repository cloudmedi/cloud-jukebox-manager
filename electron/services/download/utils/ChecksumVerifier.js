const crypto = require('crypto');
const { createLogger } = require('../../../utils/logger');
const logger = createLogger('checksum-verifier');

class ChecksumVerifier {
  static calculateMD5(chunk) {
    try {
      return crypto
        .createHash('md5')
        .update(chunk)
        .digest('hex');
    } catch (error) {
      logger.error('MD5 calculation error:', error);
      throw error;
    }
  }

  static calculateSHA256(buffer) {
    try {
      return crypto
        .createHash('sha256')
        .update(buffer)
        .digest('hex');
    } catch (error) {
      logger.error('SHA-256 calculation error:', error);
      throw error;
    }
  }

  static async verifyChunkMD5(chunk, expectedChecksum) {
    try {
      const calculatedChecksum = this.calculateMD5(chunk);
      const isValid = calculatedChecksum === expectedChecksum;
      
      if (!isValid) {
        logger.warn('Chunk MD5 verification failed', {
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

  static async verifyFileSHA256(filePath, expectedChecksum) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = require('fs').createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => {
        const calculatedChecksum = hash.digest('hex');
        const isValid = calculatedChecksum === expectedChecksum;
        
        if (!isValid) {
          logger.warn('File SHA-256 verification failed', {
            expected: expectedChecksum,
            calculated: calculatedChecksum
          });
        }
        
        resolve(isValid);
      });
      stream.on('error', reject);
    });
  }
}

module.exports = ChecksumVerifier;
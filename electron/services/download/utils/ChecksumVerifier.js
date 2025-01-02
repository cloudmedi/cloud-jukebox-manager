const crypto = require('crypto');
const fs = require('fs');
const { createLogger } = require('../../../utils/logger');

const logger = createLogger('checksum-verifier');

class ChecksumVerifier {
  static async calculateMD5(buffer) {
    try {
      return crypto
        .createHash('md5')
        .update(buffer)
        .digest('hex');
    } catch (error) {
      logger.error('MD5 calculation error:', error);
      throw error;
    }
  }

  static async calculateSHA256(buffer) {
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

  static async calculateFileChecksum(filePath) {
    return new Promise((resolve, reject) => {
      try {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', data => hash.update(data));
        stream.on('end', () => {
          const checksum = hash.digest('hex');
          logger.info(`Calculated checksum for ${filePath}: ${checksum}`);
          resolve(checksum);
        });
        stream.on('error', error => {
          logger.error(`Stream error calculating checksum for ${filePath}:`, error);
          reject(error);
        });
      } catch (error) {
        logger.error(`Error initiating checksum calculation for ${filePath}:`, error);
        reject(error);
      }
    });
  }

  static async verifyChunkChecksum(chunk, expectedChecksum) {
    try {
      const calculatedChecksum = await this.calculateMD5(chunk);
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

  static async verifyFileChecksum(filePath, expectedChecksum) {
    try {
      if (!fs.existsSync(filePath)) {
        logger.error(`File not found: ${filePath}`);
        return false;
      }

      const calculatedChecksum = await this.calculateFileChecksum(filePath);
      const isValid = calculatedChecksum === expectedChecksum;
      
      if (!isValid) {
        logger.warn('File checksum verification failed', {
          filePath,
          expected: expectedChecksum,
          calculated: calculatedChecksum
        });
      } else {
        logger.info(`File checksum verified successfully: ${filePath}`);
      }
      
      return isValid;
    } catch (error) {
      logger.error('File checksum verification error:', error);
      return false;
    }
  }
}

module.exports = ChecksumVerifier;
const crypto = require('crypto');
const { createLogger } = require('./logger');

const logger = createLogger('checksum-utils');

class ChecksumUtils {
  static calculateMD5(buffer) {
    try {
      return crypto.createHash('md5').update(buffer).digest('hex');
    } catch (error) {
      logger.error('MD5 calculation error:', error);
      throw error;
    }
  }

  static calculateSHA256(buffer) {
    try {
      return crypto.createHash('sha256').update(buffer).digest('hex');
    } catch (error) {
      logger.error('SHA-256 calculation error:', error);
      throw error;
    }
  }

  static async calculateStreamMD5(stream) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5');
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  static async calculateStreamSHA256(stream) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      stream.on('data', chunk => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
}

module.exports = ChecksumUtils;
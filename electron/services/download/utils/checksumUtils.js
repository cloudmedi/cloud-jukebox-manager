const crypto = require('crypto');
const fs = require('fs');

class ChecksumUtils {
  static calculateMD5(buffer) {
    return crypto
      .createHash('md5')
      .update(buffer)
      .digest('hex');
  }

  static calculateSHA256(buffer) {
    return crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex');
  }

  static async calculateFileChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  static async verifyFileChecksum(filePath, expectedChecksum) {
    try {
      const actualChecksum = await this.calculateFileChecksum(filePath);
      return actualChecksum === expectedChecksum;
    } catch (error) {
      console.error('Checksum verification error:', error);
      return false;
    }
  }

  static async verifyChunkChecksum(chunk, expectedChecksum) {
    try {
      const calculatedChecksum = this.calculateSHA256(chunk);
      return calculatedChecksum === expectedChecksum;
    } catch (error) {
      console.error('Chunk checksum verification error:', error);
      return false;
    }
  }
}

module.exports = ChecksumUtils;
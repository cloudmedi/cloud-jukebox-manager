const crypto = require('crypto');

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

  static async verifyChunkChecksum(chunk, expectedMD5) {
    const calculatedMD5 = this.calculateMD5(chunk);
    return calculatedMD5 === expectedMD5;
  }

  static async verifyFileChecksum(filePath, expectedSHA256) {
    const fileBuffer = await fs.promises.readFile(filePath);
    const calculatedSHA256 = this.calculateSHA256(fileBuffer);
    return calculatedSHA256 === expectedSHA256;
  }
}

module.exports = ChecksumUtils;
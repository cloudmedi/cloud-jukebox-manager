const crypto = require('crypto');

class ChecksumManager {
  calculateChunkChecksum(chunk) {
    return crypto
      .createHash('md5')
      .update(Buffer.from(chunk))
      .digest('hex');
  }

  calculateFileChecksum(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = require('fs').createReadStream(filePath);

      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', error => reject(error));
    });
  }

  async verifyChunk(chunk, expectedChecksum) {
    const actualChecksum = this.calculateChunkChecksum(chunk);
    return actualChecksum === expectedChecksum;
  }

  async verifyFile(filePath, expectedChecksum) {
    const actualChecksum = await this.calculateFileChecksum(filePath);
    return actualChecksum === expectedChecksum;
  }
}

module.exports = new ChecksumManager();
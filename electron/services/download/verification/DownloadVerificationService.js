const fs = require('fs');
const { createLogger } = require('../../../utils/logger');
const ChecksumVerifier = require('../utils/ChecksumVerifier');

const logger = createLogger('download-verification-service');

class DownloadVerificationService {
  async verifyFinalFile(filePath, expectedChecksum, songName) {
    try {
      if (!fs.existsSync(filePath)) {
        logger.error(`File not found for verification: ${filePath}`);
        return false;
      }

      const isValid = await ChecksumVerifier.verifyFileChecksum(filePath, expectedChecksum);
      
      if (!isValid) {
        logger.warn(`Final checksum verification failed for ${songName}`, {
          filePath,
          expectedChecksum
        });
        return false;
      }

      logger.info(`Final checksum verification successful for ${songName}`);
      return true;
    } catch (error) {
      logger.error(`Error during final verification for ${songName}:`, error);
      return false;
    }
  }

  async verifyChunk(chunk, songName, chunkIndex, totalChunks) {
    try {
      const chunkChecksum = await ChecksumVerifier.calculateMD5(chunk);
      const isValid = await ChecksumVerifier.verifyChunkChecksum(chunk, chunkChecksum);

      if (!isValid) {
        logger.warn(`Chunk verification failed for ${songName}`, {
          chunkIndex,
          totalChunks
        });
      }

      return isValid;
    } catch (error) {
      logger.error(`Error verifying chunk for ${songName}:`, error);
      return false;
    }
  }
}

module.exports = new DownloadVerificationService();
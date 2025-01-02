import { EventEmitter } from 'events';
import axios from 'axios';
import { createLogger } from '../../../utils/logger';
import { downloadStateManager } from './DownloadStateManager';
import { ChecksumVerifier } from '../utils/ChecksumVerifier';

const logger = createLogger('chunk-manager');

const CHUNK_SIZE = 1024 * 1024; // 1MB

interface ChunkDownloadOptions {
  url: string;
  start: number;
  end: number;
  songId: string;
  retryCount?: number;
}

class ChunkManager extends EventEmitter {
  private activeDownloads: Map<string, boolean>;

  constructor() {
    super();
    this.activeDownloads = new Map();
  }

  async downloadChunk({ url, start, end, songId, retryCount = 0 }: ChunkDownloadOptions): Promise<Buffer> {
    const chunkId = `${songId}-${start}`;
    
    try {
      if (this.activeDownloads.get(chunkId)) {
        throw new Error('Chunk download already in progress');
      }
      
      this.activeDownloads.set(chunkId, true);
      logger.debug(`Starting chunk download: ${chunkId}`);

      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer',
        headers: { Range: `bytes=${start}-${end}` },
        timeout: 30000
      });

      const chunk = Buffer.from(response.data);
      
      // Verify chunk integrity
      if (!await ChecksumVerifier.verifyChunk(chunk)) {
        throw new Error('Chunk verification failed');
      }

      downloadStateManager.updateProgress(songId, Math.floor(start / CHUNK_SIZE));
      this.activeDownloads.delete(chunkId);
      
      return chunk;

    } catch (error) {
      this.activeDownloads.delete(chunkId);
      
      if (retryCount < 3) {
        logger.warn(`Retrying chunk download: ${chunkId}`);
        return this.downloadChunk({
          url,
          start,
          end,
          songId,
          retryCount: retryCount + 1
        });
      }

      throw error;
    }
  }

  calculateChunks(fileSize: number): { start: number; end: number }[] {
    const chunks = [];
    let position = 0;

    while (position < fileSize) {
      const end = Math.min(position + CHUNK_SIZE - 1, fileSize - 1);
      chunks.push({ start: position, end });
      position = end + 1;
    }

    return chunks;
  }

  isDownloading(chunkId: string): boolean {
    return this.activeDownloads.has(chunkId);
  }
}

export const chunkManager = new ChunkManager();
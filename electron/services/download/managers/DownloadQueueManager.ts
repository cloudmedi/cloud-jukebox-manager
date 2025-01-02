import { EventEmitter } from 'events';
import { createLogger } from '../../../utils/logger';
import { downloadStateManager } from './DownloadStateManager';
import { chunkManager } from './ChunkManager';
import { Song } from '../../../types/song';

const logger = createLogger('download-queue-manager');

interface QueueItem {
  song: Song;
  baseUrl: string;
  playlistId: string;
  priority?: number;
}

class DownloadQueueManager extends EventEmitter {
  private queue: QueueItem[];
  private processing: boolean;
  private maxConcurrent: number;
  private activeDownloads: number;

  constructor() {
    super();
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 3;
    this.activeDownloads = 0;
  }

  addToQueue(item: QueueItem) {
    this.queue.push(item);
    logger.info(`Added to queue: ${item.song.name}`);
    this.processQueue();
  }

  private async processQueue() {
    if (this.processing || this.activeDownloads >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    try {
      while (this.queue.length > 0 && this.activeDownloads < this.maxConcurrent) {
        const item = this.queue.shift();
        if (!item) continue;

        this.activeDownloads++;
        this.downloadSong(item).finally(() => {
          this.activeDownloads--;
          this.processQueue();
        });
      }
    } finally {
      this.processing = false;
    }
  }

  private async downloadSong({ song, baseUrl, playlistId }: QueueItem) {
    const songUrl = `${baseUrl}/${song.filePath}`;
    
    try {
      const response = await fetch(songUrl, { method: 'HEAD' });
      const fileSize = parseInt(response.headers.get('content-length') || '0', 10);
      
      if (!fileSize) {
        throw new Error('Could not determine file size');
      }

      const chunks = chunkManager.calculateChunks(fileSize);
      downloadStateManager.initializeDownload(song._id, playlistId, chunks.length);

      const downloadPromises = chunks.map(({ start, end }) =>
        chunkManager.downloadChunk({
          url: songUrl,
          start,
          end,
          songId: song._id
        })
      );

      await Promise.all(downloadPromises);
      downloadStateManager.markAsCompleted(song._id);
      this.emit('songCompleted', song);

    } catch (error) {
      logger.error(`Error downloading song ${song.name}:`, error);
      downloadStateManager.markAsError(song._id, error.message);
      this.emit('songError', { song, error });
    }
  }

  clearQueue() {
    this.queue = [];
    logger.info('Download queue cleared');
  }
}

export const downloadQueueManager = new DownloadQueueManager();
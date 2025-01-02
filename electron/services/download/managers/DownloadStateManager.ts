import { EventEmitter } from 'events';
import Store from 'electron-store';
import { createLogger } from '../../../utils/logger';

const logger = createLogger('download-state-manager');

interface DownloadState {
  songId: string;
  playlistId: string;
  downloadedChunks: number[];
  totalChunks: number;
  progress: number;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error';
  error?: string;
}

class DownloadStateManager extends EventEmitter {
  private store: Store;
  private states: Map<string, DownloadState>;

  constructor() {
    super();
    this.store = new Store({
      name: 'download-states',
      defaults: { downloads: {} }
    });
    this.states = new Map();
    this.loadStates();
  }

  private loadStates() {
    const savedStates = this.store.get('downloads') as Record<string, DownloadState>;
    Object.entries(savedStates).forEach(([id, state]) => {
      this.states.set(id, state);
    });
    logger.info(`Loaded ${this.states.size} download states`);
  }

  private saveStates() {
    const statesObj = Object.fromEntries(this.states.entries());
    this.store.set('downloads', statesObj);
  }

  initializeDownload(songId: string, playlistId: string, totalChunks: number) {
    const state: DownloadState = {
      songId,
      playlistId,
      downloadedChunks: [],
      totalChunks,
      progress: 0,
      status: 'pending'
    };
    this.states.set(songId, state);
    this.saveStates();
    return state;
  }

  updateProgress(songId: string, chunkIndex: number) {
    const state = this.states.get(songId);
    if (!state) return;

    if (!state.downloadedChunks.includes(chunkIndex)) {
      state.downloadedChunks.push(chunkIndex);
      state.progress = (state.downloadedChunks.length / state.totalChunks) * 100;
      this.saveStates();
      this.emit('progress', { songId, progress: state.progress });
    }
  }

  markAsCompleted(songId: string) {
    const state = this.states.get(songId);
    if (!state) return;

    state.status = 'completed';
    state.progress = 100;
    this.saveStates();
    this.emit('completed', { songId });
  }

  markAsError(songId: string, error: string) {
    const state = this.states.get(songId);
    if (!state) return;

    state.status = 'error';
    state.error = error;
    this.saveStates();
    this.emit('error', { songId, error });
  }

  getState(songId: string): DownloadState | undefined {
    return this.states.get(songId);
  }

  getIncompleteDownloads(): DownloadState[] {
    return Array.from(this.states.values()).filter(
      state => state.status !== 'completed' && state.status !== 'error'
    );
  }

  clearDownload(songId: string) {
    this.states.delete(songId);
    this.saveStates();
  }
}

export const downloadStateManager = new DownloadStateManager();
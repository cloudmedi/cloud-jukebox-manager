const Store = require('electron-store');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('download-state-manager');

class DownloadStateManager {
  constructor() {
    this.store = new Store({
      name: 'download-state',
      defaults: {
        downloads: {},
        chunks: {},
        playlists: {}
      }
    });
  }

  initializePlaylistDownload(playlist) {
    const playlistState = {
      id: playlist._id,
      status: 'initializing',
      songs: playlist.songs.map(song => ({
        id: song._id,
        name: song.name,
        status: 'pending',
        chunks: [],
        progress: 0,
        retryCount: 0,
        error: null
      })),
      startedAt: Date.now(),
      lastUpdated: Date.now()
    };

    this.store.set(`playlists.${playlist._id}`, playlistState);
    logger.info(`Initialized playlist download state: ${playlist._id}`);
    return playlistState;
  }

  updateSongState(playlistId, songId, updates) {
    const path = `playlists.${playlistId}.songs`;
    const songs = this.store.get(path, []);
    const updatedSongs = songs.map(song => 
      song.id === songId ? { ...song, ...updates, lastUpdated: Date.now() } : song
    );
    
    this.store.set(path, updatedSongs);
    logger.info(`Updated song state: ${songId}`, updates);
  }

  updateChunkState(songId, chunkId, state) {
    const path = `chunks.${songId}`;
    const chunks = this.store.get(path, {});
    chunks[chunkId] = {
      ...chunks[chunkId],
      ...state,
      lastUpdated: Date.now()
    };
    
    this.store.set(path, chunks);
    logger.debug(`Updated chunk state: ${chunkId}`, state);
  }

  getIncompleteDownloads() {
    const playlists = this.store.get('playlists', {});
    return Object.values(playlists).filter(playlist => 
      playlist.status !== 'completed' && playlist.status !== 'failed'
    );
  }

  getSongDownloadState(songId) {
    const chunks = this.store.get(`chunks.${songId}`, {});
    return {
      chunks,
      completedChunks: Object.values(chunks).filter(chunk => chunk.status === 'completed').length
    };
  }

  clearPlaylistState(playlistId) {
    this.store.delete(`playlists.${playlistId}`);
    logger.info(`Cleared playlist state: ${playlistId}`);
  }
}

module.exports = new DownloadStateManager();
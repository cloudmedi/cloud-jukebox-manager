const Store = require('electron-store');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('download-state-manager');

class DownloadStateManager {
  constructor() {
    this.store = new Store({
      name: 'download-state',
      defaults: {
        playlists: {},          // Playlist durumları
        songs: {},              // Şarkı durumları
        chunks: {},             // Chunk durumları
        activePlaylistId: null, // Aktif (indirilen) playlist
        currentlyPlaying: null, // Şu anda çalan şarkı bilgisi
        lastUpdated: null
      }
    });
    
    this.baseDownloadPath = path.join(app.getPath('userData'), 'downloads');
  }

  // Yeni playlist geldiğinde
  initializePlaylistState(playlist) {
    const playlistId = playlist._id;
    
    // Mevcut çalan şarkıyı kaydet
    const currentlyPlaying = this.store.get('currentlyPlaying');
    
    // Eski playlist'i temizle ama çalan şarkıyı koru
    this.clearAllStates(currentlyPlaying);
    
    // Yeni playlist'i aktif olarak işaretle
    this.store.set('activePlaylistId', playlistId);
    
    // Yeni playlist yapısını oluştur
    const playlistState = {
      _id: playlistId,
      name: playlist.name,
      artwork: playlist.artwork,
      baseUrl: playlist.baseUrl,
      songs: playlist.songs.map(song => ({
        ...song,
        status: 'pending',
        progress: 0,
        chunks: [],
        error: null,
        localPath: path.join(this.baseDownloadPath, playlistId, `${song._id}.mp3`)
      })),
      status: 'downloading',
      startedAt: Date.now(),
      lastUpdated: Date.now()
    };

    // State'i kaydet
    this.store.set(`playlists.${playlistId}`, playlistState);
    logger.info(`Initialized playlist state: ${playlistId}`);
    
    return playlistState;
  }

  // Tüm state'leri temizle ama çalan şarkıyı koru
  clearAllStates(currentlyPlaying = null) {
    logger.info('Clearing all download states');
    
    // Önceki aktif playlist'i al
    const previousPlaylistId = this.store.get('activePlaylistId');
    
    // Eğer çalan şarkı varsa, onu koru
    if (currentlyPlaying) {
      this.store.set('currentlyPlaying', currentlyPlaying);
    }
    
    // Tüm state'i sıfırla
    this.store.set('playlists', {});
    this.store.set('songs', {});
    this.store.set('chunks', {});
    this.store.set('activePlaylistId', null);
    this.store.set('lastUpdated', Date.now());
    
    if (previousPlaylistId) {
      logger.info(`Cleared previous playlist state: ${previousPlaylistId}`);
    }
  }

  // Şarkı çalmaya başladığında
  setCurrentlyPlaying(song) {
    if (!song) return;
    
    this.store.set('currentlyPlaying', {
      ...song,
      startedAt: Date.now()
    });
    
    logger.info(`Now playing: ${song.name}`);
  }

  // Şu anda çalan şarkıyı al
  getCurrentlyPlaying() {
    return this.store.get('currentlyPlaying');
  }

  // Şarkı çalması bittiğinde
  clearCurrentlyPlaying() {
    this.store.delete('currentlyPlaying');
  }

  // Şarkı indirme durumunu güncelle
  updateSongState(playlistId, songId, state) {
    logger.info(`Updating song state for playlist ${playlistId}, song ${songId}:`, state);
    
    // State'i güncelle
    const currentState = this.store.get(`songs.${songId}`) || {};
    const newState = { ...currentState, ...state };
    this.store.set(`songs.${songId}`, newState);
    
    // WebSocket üzerinden backend'e gönder
    try {
      if (global.mainWindow && global.mainWindow.webContents) {
        const deviceToken = global.deviceToken || this.store.get('deviceToken');
        
        const message = {
          type: 'downloadProgress',
          data: {
            deviceToken,
            playlistId,
            songId,
            progress: state.progress || 0,
            status: state.status || 'downloading',
            downloadedBytes: state.downloadedBytes || 0,
            totalBytes: state.totalBytes || 0
          }
        };
        
        logger.info('Sending download progress to backend:', message);
        global.mainWindow.webContents.send('websocket-message', message);
      }
    } catch (error) {
      logger.error('Error sending download progress:', error);
    }
  }

  // Durumu güncelle ama WebSocket mesajı gönderme
  updateSongStateWithoutMessage(playlistId, songId, update) {
    try {
      const playlist = this.store.get(`playlists.${playlistId}`);
      if (!playlist) return;

      const songIndex = playlist.songs.findIndex(s => s._id === songId);
      if (songIndex === -1) return;

      playlist.songs[songIndex] = {
        ...playlist.songs[songIndex],
        ...update
      };

      this.store.set(`playlists.${playlistId}`, playlist);
    } catch (error) {
      logger.error('Error updating song state:', error);
    }
  }

  // Yarım kalan indirmeleri bul
  getIncompleteDownloads() {
    // Sadece aktif playlist'in yarım kalan indirmelerini döndür
    const activePlaylistId = this.store.get('activePlaylistId');
    if (!activePlaylistId) return [];

    const playlists = this.store.get('playlists');
    if (!playlists || !playlists[activePlaylistId]) return [];

    const activePlaylist = playlists[activePlaylistId];
    
    // Playlist'in durumunu kontrol et
    if (activePlaylist.status === 'completed') return [];

    // Yarım kalan şarkıları kontrol et
    const hasIncompleteSongs = activePlaylist.songs.some(song => 
      song.status !== 'completed' && song.status !== 'failed'
    );

    return hasIncompleteSongs ? [activePlaylist] : [];
  }

  // Checksum hesapla
  calculateChecksum(data) {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  // Yardımcı metodlar
  getChunkPath(playlistId, songId, chunkId) {
    return path.join(
      this.baseDownloadPath,
      playlistId,
      'chunks',
      `${chunkId}.chunk`
    );
  }

  // Şarkı indirme tamamlandığında
  completeSongDownload(playlistId, songId, localPath) {
    try {
      const playlist = this.store.get(`playlists.${playlistId}`);
      if (!playlist) return;

      // Şarkıyı güncelle
      const songIndex = playlist.songs.findIndex(s => s._id === songId);
      if (songIndex === -1) return;

      playlist.songs[songIndex] = {
        ...playlist.songs[songIndex],
        status: 'completed',
        localPath,
        error: null
      };

      // Playlist'i güncelle
      this.store.set(`playlists.${playlistId}`, playlist);

      // İndirme durumunu hesapla
      const totalSongs = playlist.songs.length;
      const completedSongs = playlist.songs.filter(s => s.status === 'completed').length;

      // WebSocket üzerinden ilerleme bilgisini gönder
      const websocketService = require('../websocketService');
      websocketService.sendMessage({
        type: 'downloadProgress',
        data: {
          playlistId: playlist._id,
          songId: songId,
          totalSongs: totalSongs,
          completedSongs: completedSongs,
          status: completedSongs === totalSongs ? 'completed' : 'downloading',
          songProgress: {
            current: songIndex + 1,
            total: totalSongs,
            name: playlist.songs[songIndex].name
          },
          progress: (completedSongs / totalSongs) * 100
        }
      });

      logger.info(`Song download completed: ${songId}, Progress: ${completedSongs}/${totalSongs}`);
    } catch (error) {
      logger.error('Error completing song download:', error);
    }
  }

  // Hata durumunda
  handleDownloadError(playlistId, songId, error) {
    this.updateSongState(playlistId, songId, {
      status: 'failed',
      error: error.message
    });
    logger.error(`Download error for song ${songId}:`, error);
  }

  // Chunk durumunu kaydet
  saveChunkState(playlistId, songId, chunk) {
    // Aktif playlist değilse kaydetme
    if (this.store.get('activePlaylistId') !== playlistId) {
      logger.info(`Skipping chunk save for inactive playlist: ${playlistId}`);
      return null;
    }

    const chunkId = `${songId}-${chunk.start}`;
    const chunkState = {
      id: chunkId,
      songId,
      playlistId,
      start: chunk.start,
      end: chunk.end,
      size: chunk.data.length,
      checksum: this.calculateChecksum(chunk.data),
      status: 'completed',
      lastUpdated: Date.now()
    };

    this.store.set(`chunks.${chunkId}`, chunkState);
    return chunkState;
  }

  // Belirli bir playlist'in state'ini ve dosyalarını temizle
  async clearPlaylistState(playlistId) {
    logger.info(`Clearing playlist state and files: ${playlistId}`);
    
    // Playlist'in şarkılarını bul
    const playlist = this.store.get(`playlists.${playlistId}`);
    if (!playlist) return;

    try {
      // Playlist klasörünün yolu
      const playlistDir = path.join(this.baseDownloadPath, playlistId);
      
      // Playlist klasörünü sil
      const fs = require('fs-extra');
      if (await fs.pathExists(playlistDir)) {
        await fs.remove(playlistDir);
        logger.info(`Removed playlist directory: ${playlistDir}`);
      }

      // Store'dan playlist'i sil
      this.store.delete(`playlists.${playlistId}`);
      
      // Playlist'in tüm şarkılarının chunk'larını temizle
      const chunks = this.store.get('chunks', {});
      Object.keys(chunks)
        .filter(chunkId => chunks[chunkId].playlistId === playlistId)
        .forEach(chunkId => {
          this.store.delete(`chunks.${chunkId}`);
        });
      
      // Şarkıları store'dan sil
      playlist.songs.forEach(song => {
        this.store.delete(`songs.${song._id}`);
      });
      
      // Eğer aktif playlist ise, aktif playlist'i temizle
      if (this.store.get('activePlaylistId') === playlistId) {
        this.store.delete('activePlaylistId');
      }

      logger.info(`Cleared playlist state and files: ${playlistId}`);
    } catch (error) {
      logger.error(`Error clearing playlist: ${playlistId}`, error);
    }
  }
}

module.exports = new DownloadStateManager();
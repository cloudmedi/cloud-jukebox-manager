const path = require('path');
const fs = require('fs-extra');
const { createLogger } = require('../../utils/logger');
const downloadStateManager = require('../download/DownloadStateManager');
const chunkDownloadManager = require('../download/ChunkDownloadManager');
const audioPlayer = require('../audio/AudioPlayer');
const Store = require('electron-store');
const store = new Store();

const logger = createLogger('playlist-handler');

class PlaylistHandler {
  constructor() {
    this.initialize();
  }

  async initialize() {
    try {
      // Aktif playlist'i kontrol et
      const activePlaylistId = store.get('activePlaylistId');
      if (!activePlaylistId) {
        logger.info('No active playlist found');
        return;
      }

      // Store'dan playlist'i al
      const playlists = store.get('playlists', []);
      const activePlaylist = playlists.find(p => p._id === activePlaylistId);
      if (!activePlaylist) {
        logger.error(`Active playlist not found in store: ${activePlaylistId}`);
        return;
      }

      logger.info(`Resuming active playlist: ${activePlaylistId}`);

      // Yarım kalan indirmeleri kontrol et
      const incompleteDownloads = downloadStateManager.getIncompleteDownloads();
      const activeDownload = incompleteDownloads.find(p => p._id === activePlaylistId);

      if (activeDownload) {
        // Sadece aktif playlist'in indirmelerini devam ettir
        await this.resumePlaylistDownload(activeDownload);
      }

      // En son çalan şarkıyı başlat
      audioPlayer.loadPlaylist(activePlaylist);
      audioPlayer.isPlaying = true;
      audioPlayer.play();

    } catch (error) {
      logger.error(`Initialization error: ${error.message}`);
    }
  }

  async handlePlaylist(playlist) {
    try {
      logger.info(`Handling new playlist: ${playlist._id}`);
      
      // Tüm eski state'leri temizle
      await this.clearPreviousStates();
      
      // Yeni playlist'i aktif olarak işaretle
      store.set('activePlaylistId', playlist._id);
      
      // Playlist state'i başlat
      const state = downloadStateManager.initializePlaylistState(playlist);
      
      // Store'daki playlist'i güncelle
      this.updateStoredPlaylist(playlist);
      
      // İlk şarkıyı öncelikli indir ve çal
      const firstSong = playlist.songs[0];
      if (firstSong) {
        try {
          const firstSongPath = await chunkDownloadManager.downloadSong(
            firstSong,
            playlist.baseUrl,
            playlist._id
          );

          // İlk şarkı hazır olduğunda
          if (firstSongPath) {
            logger.info(`First song ready: ${firstSongPath}`);
            firstSong.localPath = firstSongPath;
            
            // Store'daki playlist'i güncelle
            this.updateStoredPlaylist(playlist);
            
            // AudioPlayer'ı hazırla ve başlat
            audioPlayer.handleFirstSongReady(firstSong._id, firstSongPath);
            audioPlayer.loadPlaylist(playlist);
            audioPlayer.isPlaying = true;
            audioPlayer.play();
            
            logger.info('Started playing first song');
          }
        } catch (error) {
          logger.error(`Error downloading first song: ${error.message}`);
        }
      }

      // Diğer şarkıları arka planda indir
      this.downloadRemainingTracks(playlist);

      return state;
    } catch (error) {
      logger.error(`Error handling playlist: ${error.message}`);
      throw error;
    }
  }

  // Önceki tüm state'leri temizle
  async clearPreviousStates() {
    try {
      // Önceki aktif playlist'i al
      const previousPlaylistId = store.get('activePlaylistId');
      if (previousPlaylistId) {
        // Önceki playlist'in indirmelerini durdur
        await chunkDownloadManager.stopPlaylistDownloads(previousPlaylistId);
        
        // State'i temizle
        downloadStateManager.clearPlaylistState(previousPlaylistId);
        
        // Önceki playlist'in dosyalarını temizle
        const previousPlaylistPath = path.join(
          downloadStateManager.baseDownloadPath,
          previousPlaylistId
        );
        await fs.remove(previousPlaylistPath);
        
        logger.info(`Cleared previous playlist: ${previousPlaylistId}`);
      }

      // Store'dan eski playlist'i kaldır
      const playlists = store.get('playlists', []);
      if (previousPlaylistId) {
        const filteredPlaylists = playlists.filter(p => p._id !== previousPlaylistId);
        store.set('playlists', filteredPlaylists);
      }

    } catch (error) {
      logger.error(`Error clearing previous states: ${error.message}`);
    }
  }

  // Kalan şarkıları arka planda indir
  async downloadRemainingTracks(playlist) {
    logger.info(`Starting to download remaining tracks for playlist: ${playlist._id}`);
    
    for (let i = 1; i < playlist.songs.length; i++) {
      const song = playlist.songs[i];
      try {
        // Aktif playlist değişti mi kontrol et
        const currentActiveId = store.get('activePlaylistId');
        if (currentActiveId !== playlist._id) {
          logger.info('Active playlist changed, stopping downloads');
          return;
        }

        // Şarkı zaten indirilmiş mi kontrol et
        if (song.localPath) {
          logger.info(`Song ${song._id} already downloaded`);
          continue;
        }

        logger.info(`Downloading song ${i + 1}/${playlist.songs.length}: ${song.name}`);
        const songPath = await chunkDownloadManager.downloadSong(
          song,
          playlist.baseUrl,
          playlist._id
        );
        
        // Şarkı hazır olduğunda
        if (songPath) {
          song.localPath = songPath;
          
          // Store'daki playlist'i güncelle
          this.updateStoredPlaylist(playlist);
          
          // AudioPlayer'a bildir
          audioPlayer.handleSongReady(song._id, songPath);
          
          logger.info(`Successfully downloaded song ${i + 1}/${playlist.songs.length}`);
        }
      } catch (error) {
        logger.error(`Error downloading song ${song._id}:`, error);
        continue;
      }
    }
    
    logger.info(`Finished downloading remaining tracks for playlist: ${playlist._id}`);
  }

  async resumePlaylistDownload(playlistState) {
    try {
      logger.info(`Resuming playlist download: ${playlistState._id}`);

      // Store'dan mevcut playlist'i al
      const playlists = store.get('playlists', []);
      const playlist = playlists.find(p => p._id === playlistState._id);
      
      if (!playlist) {
        logger.error(`Playlist not found in store: ${playlistState._id}`);
        return;
      }

      // Her şarkı için
      for (const song of playlistState.songs) {
        // Aktif playlist değişti mi kontrol et
        const currentActiveId = store.get('activePlaylistId');
        if (currentActiveId !== playlistState._id) {
          logger.info('Active playlist changed, stopping downloads');
          return;
        }

        if (song.status !== 'completed') {
          try {
            const songPath = await chunkDownloadManager.downloadSong(
              song,
              playlistState.baseUrl,
              playlistState._id
            );

            // Şarkı hazır olduğunda
            if (songPath) {
              song.localPath = songPath;
              
              // Store'daki playlist'i güncelle
              const storedSong = playlist.songs.find(s => s._id === song._id);
              if (storedSong) {
                storedSong.localPath = songPath;
              }
              this.updateStoredPlaylist(playlist);
              
              // AudioPlayer'a bildir
              audioPlayer.handleSongReady(song._id, songPath);
            }
          } catch (error) {
            logger.error(`Error resuming song ${song._id}:`, error);
            continue;
          }
        }
      }
    } catch (error) {
      logger.error(`Error resuming playlist: ${error.message}`);
      throw error;
    }
  }

  // Store'daki playlist'i güncelle
  updateStoredPlaylist(playlist) {
    const playlists = store.get('playlists', []);
    const index = playlists.findIndex(p => p._id === playlist._id);
    
    if (index !== -1) {
      playlists[index] = playlist;
    } else {
      playlists.push(playlist);
    }
    
    store.set('playlists', playlists);
    logger.info(`Updated stored playlist: ${playlist._id}`);
  }

  // Playlist silme işlemi
  async deletePlaylist(playlistId) {
    try {
      const playlistPath = path.join(
        downloadStateManager.baseDownloadPath,
        playlistId
      );

      // Dosyaları sil
      await fs.remove(playlistPath);
      
      // State'i temizle
      downloadStateManager.clearPlaylistState(playlistId);
      
      // Store'dan sil
      const playlists = store.get('playlists', []);
      const filteredPlaylists = playlists.filter(p => p._id !== playlistId);
      store.set('playlists', filteredPlaylists);

      // Aktif playlist ise temizle
      if (store.get('activePlaylistId') === playlistId) {
        store.delete('activePlaylistId');
      }
      
      logger.info(`Deleted playlist: ${playlistId}`);
    } catch (error) {
      logger.error(`Error deleting playlist: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new PlaylistHandler();
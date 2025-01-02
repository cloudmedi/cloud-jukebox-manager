const path = require('path');
const { createLogger } = require('../../utils/logger');
const batchDownloadManager = require('../download/managers/BatchDownloadManager');
const audioPlayer = require('../audio/AudioPlayer');

const logger = createLogger('playlist-handler');

class PlaylistHandler {
  constructor() {
    this.downloadPath = path.join(process.env.APPDATA || process.env.HOME, 'cloud-media-player', 'downloads');
  }

  async handlePlaylist(playlist) {
    try {
      logger.info(`Handling playlist: ${playlist.name}`);
      
      const playlistDir = path.join(this.downloadPath, playlist._id);
      
      // İlk şarkıyı hemen indir ve çalmaya başla
      if (playlist.songs.length > 0) {
        const firstSong = playlist.songs[0];
        logger.info(`Starting download of first song: ${firstSong.name}`);
        
        await batchDownloadManager.downloadSong(
          firstSong,
          playlist.baseUrl,
          playlistDir,
          playlist._id
        );

        firstSong.localPath = path.join(playlistDir, `${firstSong._id}.mp3`);
        
        if (audioPlayer) {
          audioPlayer.handleFirstSongReady(firstSong._id, firstSong.localPath);
        }
      }

      // Kalan şarkıları batch olarak indir
      batchDownloadManager.startBatchDownload(playlist, playlist.baseUrl, playlistDir)
        .catch(error => {
          logger.error('Error in batch download:', error);
        });

      return true;
    } catch (error) {
      logger.error('Error handling playlist:', error);
      throw error;
    }
  }
}

module.exports = new PlaylistHandler();
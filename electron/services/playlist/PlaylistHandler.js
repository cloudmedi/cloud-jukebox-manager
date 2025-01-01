const ProgressiveDownloader = require('../download/ProgressiveDownloader');
const audioPlayer = require('../audio/AudioPlayer');
const { BrowserWindow } = require('electron');
const { createLogger } = require('../../utils/logger');

const logger = createLogger('PlaylistHandler');

class PlaylistHandler {
  constructor() {
    this.setupDownloadListeners();
    logger.info('PlaylistHandler initialized');
  }

  setupDownloadListeners() {
    ProgressiveDownloader.on('firstSongReady', (song) => {
      logger.info('First song ready, starting playback:', song.name);
      audioPlayer.loadAndPlay(song);
      this.updateRenderer('playlistStatus', { status: 'playing', currentSong: song });
    });

    ProgressiveDownloader.on('downloadProgress', ({ song, progress }) => {
      logger.info(`Download progress for ${song.name}: ${progress}%`);
      this.updateRenderer('downloadProgress', { song, progress });
    });

    ProgressiveDownloader.on('downloadComplete', ({ song, path }) => {
      logger.info('Song download complete:', song.name);
      this.updateRenderer('songReady', { song, path });
    });

    ProgressiveDownloader.on('error', ({ song, error }) => {
      logger.error('Download error:', error);
      this.updateRenderer('error', { song, error: error.message });
    });
  }

  updateRenderer(type, data) {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      win.webContents.send(type, data);
    }
  }

  async handlePlaylist(playlist) {
    logger.info('New playlist received:', playlist.name);
    
    // Mevcut indirmeleri iptal et
    ProgressiveDownloader.cancelDownloads();
    
    // Yeni playlist'i başlat
    await ProgressiveDownloader.startPlaylistDownload(playlist, 'http://localhost:5000');
    
    return true;
  }
}

module.exports = new PlaylistHandler();
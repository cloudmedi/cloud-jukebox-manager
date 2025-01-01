const ProgressiveDownloader = require('../download/ProgressiveDownloader');
const audioPlayer = require('../audio/AudioPlayer');
const { BrowserWindow } = require('electron');

class PlaylistHandler {
  constructor() {
    this.setupDownloadListeners();
  }

  setupDownloadListeners() {
    ProgressiveDownloader.on('firstSongReady', (song) => {
      console.log('First song ready, starting playback:', song.name);
      audioPlayer.loadAndPlay(song);
      this.updateRenderer('playlistStatus', { status: 'playing', currentSong: song });
    });

    ProgressiveDownloader.on('downloadProgress', ({ song, progress }) => {
      this.updateRenderer('downloadProgress', { song, progress });
    });

    ProgressiveDownloader.on('downloadComplete', ({ song, path }) => {
      console.log('Song download complete:', song.name);
      audioPlayer.addToQueue(song);
      this.updateRenderer('songReady', { song, path });
    });

    ProgressiveDownloader.on('error', ({ song, error }) => {
      console.error('Download error:', error);
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
    console.log('New playlist received:', playlist.name);
    
    // Mevcut indirmeleri iptal et
    ProgressiveDownloader.cancelDownloads();
    
    // Yeni playlist'i başlat
    await ProgressiveDownloader.startPlaylistDownload(playlist, 'http://localhost:5000');
    
    return true;
  }
}

module.exports = new PlaylistHandler();
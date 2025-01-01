const ProgressiveDownloader = require('./ProgressiveDownloader');
const websocketService = require('../websocketService');
const audioPlayer = require('../audio/AudioPlayer');

class PlaylistHandler {
  constructor() {
    this.currentPlaylist = null;
  }

  async handlePlaylist(playlist) {
    console.log('New playlist received:', playlist.name);

    // Mevcut indirmeleri iptal et
    ProgressiveDownloader.cancelDownloads();

    // Yeni playlist'i kaydet
    this.currentPlaylist = playlist;

    // İlk şarkı hazır olduğunda çalmaya başla
    ProgressiveDownloader.startPlaylistDownload(playlist, (firstSong) => {
      console.log('First song ready:', firstSong.name);
      
      // Playlist durumunu güncelle
      websocketService.sendMessage({
        type: 'playlistStatus',
        status: 'loading',
        playlistId: playlist._id,
        message: 'First song ready, starting playback'
      });

      // Audio player'a playlist'i yükle
      audioPlayer.loadPlaylist({
        ...playlist,
        songs: [firstSong] // Şimdilik sadece ilk şarkıyı ekle
      });
    });

    return true;
  }
}

module.exports = new PlaylistHandler();
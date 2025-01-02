const path = require('path');
const Store = require('electron-store');
const store = new Store();
const chunkDownloadManager = require('../download/ChunkDownloadManager');
const downloadStateManager = require('../download/DownloadStateManager');

class PlaylistHandler {
  constructor() {
    this.downloadPath = path.join(require('electron').app.getPath('userData'), 'downloads');
  }

  async handlePlaylist(playlist) {
    try {
      console.log('Handling playlist:', playlist.name);
      
      // Initialize playlist download state
      downloadStateManager.initializePlaylistDownload(playlist);

      // İlk şarkıyı hemen indir
      const firstSong = playlist.songs[0];
      if (firstSong) {
        console.log('Starting download of first song:', firstSong.name);
        const firstSongPath = await chunkDownloadManager.downloadSong(
          firstSong,
          playlist.baseUrl,
          playlist._id
        );

        if (firstSongPath) {
          console.log('First song ready:', firstSongPath);
          firstSong.localPath = firstSongPath;
        }
      }

      // Kalan şarkıları kuyruğa ekle
      console.log('Adding remaining songs to queue');
      for (let i = 1; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        console.log(`Adding song to queue: ${song.name}`);
        chunkDownloadManager.queueSongDownload(
          song,
          playlist.baseUrl,
          playlist._id
        );
      }

      // Store playlist info
      const playlists = store.get('playlists', []);
      const existingIndex = playlists.findIndex(p => p._id === playlist._id);
      
      if (existingIndex !== -1) {
        playlists[existingIndex] = playlist;
      } else {
        playlists.push(playlist);
      }
      
      store.set('playlists', playlists);
      
      return playlist;

    } catch (error) {
      console.error('Error handling playlist:', error);
      throw error;
    }
  }
}

module.exports = new PlaylistHandler();
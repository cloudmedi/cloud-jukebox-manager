const { app } = require('electron');
const path = require('path');
const Store = require('electron-store');
const audioPlayer = require('./audioPlayer');
const { PlaylistDownloader } = require('./PlaylistDownloader');

class PlaylistService {
  constructor() {
    this.store = new Store();
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    this.downloader = new PlaylistDownloader();
  }

  handlePlaylistMessage(playlist, ws) {
    console.log('Playlist mesajı alındı:', playlist);
    
    try {
      this.downloader.downloadPlaylist(playlist, ws)
        .then(() => {
          // Playlist'i local veritabanına kaydet
          this.savePlaylistToDb(playlist);
          
          // Çalmaya başla
          audioPlayer.loadPlaylist(playlist);
          audioPlayer.play();
          
          ws.send(JSON.stringify({
            type: 'playlistReady',
            playlistId: playlist._id
          }));
        })
        .catch(error => {
          console.error('Playlist indirme hatası:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: error.message
          }));
        });
    } catch (error) {
      console.error('Playlist işleme hatası:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  }

  savePlaylistToDb(playlist) {
    const playlistPath = path.join(this.downloadPath, playlist._id);
    const playlistData = {
      _id: playlist._id,
      name: playlist.name,
      songs: playlist.songs.map(song => ({
        ...song,
        localPath: path.join(playlistPath, `${song._id}.mp3`)
      })),
      createdAt: new Date().toISOString()
    };

    this.store.set(`playlists.${playlist._id}`, playlistData);
  }

  resumeIncompleteDownloads(ws) {
    const downloads = this.store.get('download');
    if (!downloads) return;

    Object.entries(downloads).forEach(([playlistId, download]) => {
      if (download.status === 'downloading') {
        const playlist = this.store.get(`playlists.${playlistId}`);
        if (playlist) {
          this.handlePlaylistMessage({ playlist }, ws);
        }
      }
    });
  }
}

module.exports = new PlaylistService();
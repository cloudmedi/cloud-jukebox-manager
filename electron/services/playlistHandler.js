const { ipcRenderer } = require('electron');
const { downloadFile } = require('./downloadUtils');
const path = require('path');
const fs = require('fs');

class PlaylistHandler {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    ipcRenderer.on('play-playlist', async (event, playlist) => {
      console.log('Received playlist for processing:', playlist);
      await this.handlePlaylist(playlist);
    });
  }

  async handlePlaylist(playlist) {
    try {
      // Playlist için indirme klasörünü oluştur
      const playlistDir = path.join(process.env.APPDATA || process.env.HOME, 'cloud-media-player', 'playlists', playlist._id);
      
      if (!fs.existsSync(playlistDir)) {
        fs.mkdirSync(playlistDir, { recursive: true });
      }

      console.log('Processing songs:', playlist.songs);

      for (const song of playlist.songs) {
        const songPath = path.join(playlistDir, `${song._id}.mp3`);
        const songUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

        console.log('Downloading song:', {
          name: song.name,
          url: songUrl,
          path: songPath
        });

        // İndirme durumunu bildir
        ipcRenderer.send('download-progress', {
          songName: song.name,
          progress: 0
        });

        try {
          await downloadFile(songUrl, songPath, (progress) => {
            ipcRenderer.send('download-progress', {
              songName: song.name,
              progress
            });
          });

          // Şarkı yolunu güncelle
          song.localPath = songPath;
        } catch (error) {
          console.error(`Error downloading song ${song.name}:`, error);
          ipcRenderer.send('download-progress', {
            songName: song.name,
            error: error.message
          });
        }
      }

      // Playlist hazır, oynatıcıyı güncelle
      ipcRenderer.send('update-player', playlist.songs[0]);

    } catch (error) {
      console.error('Error handling playlist:', error);
    }
  }
}

module.exports = new PlaylistHandler();
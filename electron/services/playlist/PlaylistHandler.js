const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Store = require('electron-store');
const store = new Store();

class PlaylistHandler {
  constructor() {
    this.downloadPath = path.join(app.getPath('userData'), 'downloads');
    this.ensureDirectoryExists(this.downloadPath);
  }

  ensureDirectoryExists(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async handlePlaylist(playlist) {
    try {
      console.log('Handling playlist:', playlist.name);
      
      // Playlist için klasör oluştur
      const playlistDir = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistDir);

      // İlk şarkıyı öncelikli olarak indir
      if (playlist.songs.length > 0) {
        const firstSong = playlist.songs[0];
        console.log('Downloading first song:', firstSong.name);
        
        try {
          const songPath = path.join(playlistDir, `${firstSong._id}.mp3`);
          const songUrl = `${playlist.baseUrl}/${firstSong.filePath.replace(/\\/g, '/')}`;
          
          await this.downloadFile(songUrl, songPath);
          
          // İlk şarkıyı localPath ile güncelle
          firstSong.localPath = songPath;
          
          // İlk şarkıyı çalmak için event gönder
          const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
          if (mainWindow) {
            mainWindow.webContents.send('update-player', {
              playlist: {
                ...playlist,
                songs: [firstSong]
              },
              currentSong: firstSong,
              isPlaying: true
            });
          }
        } catch (error) {
          console.error('Error downloading first song:', error);
        }
      }

      // Diğer şarkıları arka planda indir
      for (let i = 1; i < playlist.songs.length; i++) {
        const song = playlist.songs[i];
        try {
          const songPath = path.join(playlistDir, `${song._id}.mp3`);
          const songUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
          
          await this.downloadFile(songUrl, songPath);
          
          // Her şarkı indirildiğinde playlist'i güncelle
          playlist.songs[i] = {
            ...song,
            localPath: songPath
          };
          
          // Store'u güncelle
          const playlists = store.get('playlists', []);
          const existingIndex = playlists.findIndex(p => p._id === playlist._id);
          
          if (existingIndex !== -1) {
            playlists[existingIndex] = playlist;
          } else {
            playlists.push(playlist);
          }
          
          store.set('playlists', playlists);
          
        } catch (error) {
          console.error(`Error downloading song ${song.name}:`, error);
        }
      }

      return true;
    } catch (error) {
      console.error('Error handling playlist:', error);
      throw error;
    }
  }

  async downloadFile(url, filePath) {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(filePath);

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
}

module.exports = new PlaylistHandler();
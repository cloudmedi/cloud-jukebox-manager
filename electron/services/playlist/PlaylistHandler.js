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
      
      const playlistDir = path.join(this.downloadPath, playlist._id);
      this.ensureDirectoryExists(playlistDir);

      const updatedSongs = await Promise.all(
        playlist.songs.map(async (song) => {
          try {
            const songPath = path.join(playlistDir, `${song._id}.mp3`);
            const songUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;

            if (!fs.existsSync(songPath)) {
              console.log(`Downloading song: ${song.name}`);
              await this.downloadFile(songUrl, songPath);
            }

            return {
              ...song,
              localPath: songPath
            };
          } catch (error) {
            console.error(`Error downloading song ${song.name}:`, error);
            return song;
          }
        })
      );

      const updatedPlaylist = {
        ...playlist,
        songs: updatedSongs
      };

      const playlists = store.get('playlists', []);
      const existingIndex = playlists.findIndex(p => p._id === playlist._id);
      
      if (existingIndex !== -1) {
        playlists[existingIndex] = updatedPlaylist;
      } else {
        playlists.push(updatedPlaylist);
      }
      
      store.set('playlists', playlists);
      
      // Playlist hazır olduğunda ana pencereye bildir
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.webContents.send('playlist-updated', updatedPlaylist);
      }
      
      return updatedPlaylist;
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

module.exports = PlaylistHandler;
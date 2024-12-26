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

  async handlePlaylistMessage(message) {
    console.log('Handling playlist message:', message);
    
    try {
      switch (message.action) {
        case 'deleted':
          console.log('Handling playlist deletion:', message.playlistId);
          await this.handlePlaylistDeletion(message.playlistId);
          break;
        case 'updated':
          console.log('Handling playlist update:', message.data);
          return await this.handlePlaylist(message.data);
        default:
          console.log('Handling new playlist:', message);
          return await this.handlePlaylist(message);
      }
    } catch (error) {
      console.error('Error in handlePlaylistMessage:', error);
      throw error;
    }
  }

  async handlePlaylistDeletion(playlistId) {
    console.log('Starting playlist deletion process:', playlistId);
    
    try {
      // Store'dan playlist'i bul
      const playlists = store.get('playlists', []);
      const playlistToDelete = playlists.find(p => p._id === playlistId);

      if (!playlistToDelete) {
        console.log('Playlist not found in store:', playlistId);
        return;
      }

      console.log('Found playlist to delete:', playlistToDelete.name);

      // Playlist klasörünü ve şarkıları sil
      const playlistDir = path.join(this.downloadPath, playlistId);
      if (fs.existsSync(playlistDir)) {
        console.log('Deleting playlist directory:', playlistDir);
        fs.rmSync(playlistDir, { recursive: true, force: true });
      }

      // Store'dan playlist'i kaldır
      const updatedPlaylists = playlists.filter(p => p._id !== playlistId);
      store.set('playlists', updatedPlaylists);
      console.log('Playlist removed from store');

      // Renderer'a bildir
      const mainWindow = require('electron').BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        console.log('Notifying renderer about playlist deletion');
        mainWindow.webContents.send('playlist-deleted', playlistId);
      }

      return { success: true, message: 'Playlist deleted successfully' };
    } catch (error) {
      console.error('Error deleting playlist:', error);
      throw error;
    }
  }

  async handlePlaylist(playlist) {
    try {
      console.log('Processing playlist:', playlist.name);
      
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
      console.log('Playlist saved to store:', updatedPlaylist.name);
      
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
      writer.on('finish', () => {
        console.log('File downloaded successfully:', filePath);
        resolve();
      });
      writer.on('error', (error) => {
        console.error('Error downloading file:', error);
        reject(error);
      });
    });
  }
}

module.exports = new PlaylistHandler();
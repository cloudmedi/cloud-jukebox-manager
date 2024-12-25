const { BrowserWindow } = require('electron');
const ArtworkManager = require('../artwork/ArtworkManager');

class PlaylistDisplayManager {
  constructor() {
    this.mainWindow = null;
  }

  setMainWindow(window) {
    this.mainWindow = window;
  }

  async displayPlaylist(playlist) {
    if (!playlist) return;

    try {
      // Artwork'ü yerel dosya sistemine kaydet
      if (playlist.artwork) {
        const localArtworkPath = await ArtworkManager.saveArtwork(playlist.artwork);
        if (localArtworkPath) {
          playlist.artwork = localArtworkPath;
        }
      }

      // Playlist'i renderer'a gönder
      if (this.mainWindow) {
        this.mainWindow.webContents.send('playlist-received', playlist);
        console.log('Playlist sent to renderer with artwork:', playlist.artwork);
      }
    } catch (error) {
      console.error('Error displaying playlist:', error);
    }
  }
}

module.exports = new PlaylistDisplayManager();
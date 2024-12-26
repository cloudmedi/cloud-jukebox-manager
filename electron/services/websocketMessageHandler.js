const { BrowserWindow } = require('electron');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const audioPlayer = require('./audioPlayer');

class WebSocketMessageHandler {
  constructor() {
    this.handlers = new Map();
    this.store = new Store();
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.handlers.set('playlist', this.handlePlaylist.bind(this));
    this.handlers.set('command', this.handleCommand.bind(this));
    this.handlers.set('songRemoved', this.handleSongRemoved.bind(this));
  }

  async handleMessage(message) {
    console.log('Processing message:', message);
    const handler = this.handlers.get(message.type);
    
    if (handler) {
      try {
        await handler(message);
      } catch (error) {
        console.error('Message handling error:', error);
        this.sendToRenderer('error', {
          type: 'error',
          message: error.message
        });
      }
    } else {
      console.warn('No handler found for message type:', message.type);
    }
  }

  handleCommand(message) {
    console.log('Handling command:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];

    switch (message.command) {
      case 'restart':
        console.log('Restarting application...');
        setTimeout(() => {
          app.relaunch();
          app.exit(0);
        }, 1000);
        break;
        
      default:
        if (mainWindow) {
          mainWindow.webContents.send(message.command, message.data);
        }
        break;
    }
  }

  async handlePlaylist(message) {
    console.log('Handling playlist message:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    switch (message.action) {
      case 'deleted':
        console.log('Processing playlist deletion:', message.data);
        // Get current playlists from store
        const playlists = this.store.get('playlists', []);
        const deletedPlaylistId = message.data.playlistId;
        
        // Find the deleted playlist
        const deletedPlaylist = playlists.find(p => p._id === deletedPlaylistId);
        if (deletedPlaylist) {
          console.log('Found playlist to delete:', deletedPlaylist.name);
          
          // Stop playback if the deleted playlist is currently playing
          const currentPlaylist = audioPlayer.getCurrentPlaylist();
          if (currentPlaylist && currentPlaylist._id === deletedPlaylistId) {
            console.log('Stopping playback of deleted playlist');
            audioPlayer.stop();
          }
          
          // Remove playlist from store
          this.store.set('playlists', playlists.filter(p => p._id !== deletedPlaylistId));
          console.log('Removed playlist from store');
          
          // Delete local files
          if (deletedPlaylist.songs) {
            deletedPlaylist.songs.forEach(song => {
              if (song.localPath) {
                try {
                  fs.unlinkSync(song.localPath);
                  console.log('Deleted song file:', song.localPath);
                } catch (error) {
                  console.error('Error deleting song file:', error);
                }
              }
            });
          }
          
          // Notify renderer to update UI
          mainWindow.webContents.send('playlist-deleted', {
            playlistId: deletedPlaylistId
          });
          
          console.log('Playlist deletion process completed');
        } else {
          console.log('Playlist not found:', deletedPlaylistId);
        }
        break;

      case 'update':
        console.log('Processing playlist update:', message.data);
        const playlist = message.data;
        if (!playlist || !playlist.songs) {
          console.error('Invalid playlist data:', playlist);
          return;
        }

        // Create download directory for playlist
        const userDataPath = app.getPath('userData');
        const playlistDir = path.join(
          userDataPath,
          'downloads',
          playlist._id
        );

        if (!fs.existsSync(playlistDir)) {
          fs.mkdirSync(playlistDir, { recursive: true });
        }

        // Store playlist with local paths
        const storedPlaylist = {
          _id: playlist._id,
          name: playlist.name,
          artwork: playlist.artwork,
          songs: []
        };

        // Download songs
        for (const song of playlist.songs) {
          try {
            console.log('Processing song:', song);
            const songUrl = `${playlist.baseUrl}/${song.filePath.replace(/\\/g, '/')}`;
            const filename = `${song._id}${path.extname(song.filePath)}`;
            const localPath = path.join(playlistDir, filename);

            mainWindow.webContents.send('download-progress', {
              songName: song.name,
              progress: 0
            });

            await downloadFile(songUrl, localPath, (progress) => {
              mainWindow.webContents.send('download-progress', {
                songName: song.name,
                progress
              });
            });

            storedPlaylist.songs.push({
              ...song,
              localPath
            });

          } catch (error) {
            console.error(`Error downloading song ${song.name}:`, error);
            mainWindow.webContents.send('download-error', {
              songName: song.name,
              error: error.message
            });
          }
        }

        console.log('Storing playlist with localPaths:', storedPlaylist);
        mainWindow.webContents.send('playlist-received', storedPlaylist);
        break;
    }
  }

  async handleSongRemoved(message) {
    console.log('Handling song removal:', message);
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    const { songId, playlistId } = message.data;
    
    const playlists = this.store.get('playlists', []);
    const playlistIndex = playlists.findIndex(p => p._id === playlistId);
    
    if (playlistIndex !== -1) {
      console.log('Found playlist:', playlists[playlistIndex].name);
      
      playlists[playlistIndex].songs = playlists[playlistIndex].songs.filter(
        song => song._id !== songId
      );
      
      this.store.set('playlists', playlists);
      console.log('Updated playlists in store');
      
      mainWindow.webContents.send('songRemoved', {
        songId,
        playlistId
      });
      
      const removedSong = playlists[playlistIndex].songs.find(s => s._id === songId);
      if (removedSong && removedSong.localPath) {
        try {
          fs.unlinkSync(removedSong.localPath);
          console.log('Deleted local song file:', removedSong.localPath);
        } catch (error) {
          console.error('Error deleting local file:', error);
        }
      }
    } else {
      console.log('Playlist not found:', playlistId);
    }
  }

  sendToRenderer(channel, data) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      mainWindow.webContents.send(channel, data);
    }
  }
}

module.exports = new WebSocketMessageHandler();
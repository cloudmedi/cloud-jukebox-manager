const { BrowserWindow } = require('electron');
const { downloadFile } = require('../downloadUtils');
const path = require('path');
const Store = require('electron-store');
const store = new Store();

async function handlePlaylist(message) {
  console.log('Handling playlist message:', message);
  const mainWindow = BrowserWindow.getAllWindows()[0];
  if (!mainWindow) return;

  const playlist = message.data;
  if (!playlist || !playlist.songs) {
    console.error('Invalid playlist data:', playlist);
    return;
  }

  // Playlist için indirme klasörünü oluştur
  const userDataPath = require('electron').app.getPath('userData');
  const playlistDir = path.join(
    userDataPath,
    'downloads',
    playlist._id
  );

  // Store'a kaydedilecek playlist objesi
  const storedPlaylist = {
    _id: playlist._id,
    name: playlist.name,
    artwork: playlist.artwork,
    songs: []
  };

  // Her şarkıyı indir
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

  // Playlist'i store'a kaydet ve UI'ı güncelle
  store.set(`playlists.${playlist._id}`, storedPlaylist);
  mainWindow.webContents.send('playlist-received', storedPlaylist);
}

module.exports = { handlePlaylist };
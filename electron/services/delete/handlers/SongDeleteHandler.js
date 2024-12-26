const BaseDeleteHandler = require('./BaseDeleteHandler');
const FileManager = require('../../playlist/FileManager');
const PlaylistStore = require('../../playlist/PlaylistStore');

class SongDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('song');
  }

  async preDelete(id, data) {
    const { playlistId } = data;
    if (!playlistId) {
      throw new Error('Playlist ID is required for song deletion');
    }
  }

  async executeDelete(id, data) {
    const { playlistId } = data;
    
    // Şarkı dosyasını sil
    await FileManager.deleteSongFile(playlistId, id);
    
    // Playlist'ten şarkıyı kaldır
    const playlist = PlaylistStore.getPlaylist(playlistId);
    if (playlist) {
      playlist.songs = playlist.songs.filter(song => song._id !== id);
      PlaylistStore.savePlaylist(playlist);
    }
  }

  async postDelete(id, data) {
    // Player'ı güncelle
    const { playlistId } = data;
    global.audioService?.handleSongDeleted(playlistId, id);
  }
}

module.exports = SongDeleteHandler;
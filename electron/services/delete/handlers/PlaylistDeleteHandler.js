const BaseDeleteHandler = require('./BaseDeleteHandler');
const FileManager = require('../../playlist/FileManager');
const PlaylistStore = require('../../playlist/PlaylistStore');

class PlaylistDeleteHandler extends BaseDeleteHandler {
  constructor() {
    super('playlist');
  }

  async preDelete(id) {
    // Playlist'in çalınıp çalınmadığını kontrol et
    const playlist = PlaylistStore.getPlaylist(id);
    if (!playlist) {
      throw new Error('Playlist not found');
    }
  }

  async executeDelete(id) {
    // Önce dosyaları sil
    await FileManager.deletePlaylistFiles(id);
    
    // Sonra store'dan kaldır
    PlaylistStore.deletePlaylist(id);
  }

  async postDelete(id) {
    // Player'ı güncelle
    global.audioService?.handlePlaylistDeleted(id);
  }
}

module.exports = PlaylistDeleteHandler;
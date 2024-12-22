class PlaylistMessage {
  static create(playlist, type = 'playlist') {
    return {
      type,
      playlist: {
        _id: playlist._id,
        name: playlist.name,
        songs: playlist.songs.map(song => ({
          _id: song._id,
          name: song.name,
          artist: song.artist,
          filePath: song.filePath
        }))
      }
    };
  }
}

module.exports = PlaylistMessage;
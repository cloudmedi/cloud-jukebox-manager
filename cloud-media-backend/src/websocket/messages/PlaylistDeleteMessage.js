class PlaylistDeleteMessage {
  static create(playlist) {
    return {
      type: 'playlist',
      action: 'deleted',
      data: {
        playlistId: playlist._id,
        name: playlist.name,
        status: 'deleted'
      }
    };
  }
}

module.exports = PlaylistDeleteMessage;
class PlaylistHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handlePlaylistDeleted(playlistId) {
    console.log('Broadcasting playlist deletion:', playlistId);
    
    this.wss.broadcastToAdmins({
      type: 'playlist',
      action: 'deleted',
      data: {
        playlistId: playlistId
      }
    });
    
    console.log('Playlist deletion broadcast complete');
  }

  async handleSendPlaylist(data) {
    console.log('Sending playlist to devices:', data);
    const { deviceIds, playlist } = data;
    let success = true;

    for (const deviceId of deviceIds) {
      const sent = this.wss.sendToDevice(deviceId, {
        type: 'playlist',
        action: 'load',
        data: playlist
      });

      if (!sent) {
        console.log(`Failed to send playlist to device: ${deviceId}`);
        success = false;
      }
    }

    console.log('Playlist send operation complete');
    return success;
  }

  async handlePlaylistStatus(data, deviceToken) {
    console.log('Handling playlist status update:', data);
    
    this.wss.broadcastToAdmins({
      type: 'playlistStatus',
      deviceToken: deviceToken,
      status: data.status,
      playlistId: data.playlistId,
      error: data.error
    });
    
    console.log('Playlist status broadcast complete');
  }

  async handlePlaylistUpdate(playlist) {
    console.log('Broadcasting playlist update:', playlist._id);
    
    this.wss.broadcastToAdmins({
      type: 'playlist',
      action: 'updated',
      data: playlist
    });
    
    console.log('Playlist update broadcast complete');
  }

  async handlePlaylistCreate(playlist) {
    console.log('Broadcasting new playlist:', playlist._id);
    
    this.wss.broadcastToAdmins({
      type: 'playlist',
      action: 'created',
      data: playlist
    });
    
    console.log('New playlist broadcast complete');
  }
}

module.exports = PlaylistHandler;
class CommandMessageHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleCommand(data, ws) {
    console.log('Command message received:', data);
    
    switch (data.command) {
      case 'songRemoved':
        this.handleSongRemoved(data);
        break;
      case 'deleteAnnouncement':
        console.log('Processing deleteAnnouncement command:', data);
        this.wss.deleteAnnouncementHandler.handleDeleteCommand(data.announcementId);
        break;
      case 'restart':
        console.log('Restarting application...');
        app.relaunch();
        app.exit(0);
        break;
      default:
        console.log('Unknown command:', data.command);
        break;
    }
  }

  handleSongRemoved(data) {
    console.log('Processing songRemoved command:', data);
    this.wss.broadcastToAdmins({
      type: 'command',
      command: 'songRemoved',
      data: {
        songId: data.data.songId,
        playlistId: data.data.playlistId
      }
    });
  }
}

module.exports = CommandMessageHandler;

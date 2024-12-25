class CommandHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleCommand(data) {
    console.log('Handling command:', data);
    
    switch (data.command) {
      case 'songRemoved':
        return this.handleSongRemoved(data);
      default:
        return this.wss.sendToDevice(data.token, data);
    }
  }

  async handleSongRemoved(data) {
    console.log('Handling songRemoved command:', data);
    return this.wss.sendToDevice(data.token, {
      type: 'songRemoved',
      songId: data.data.songId,
      playlistId: data.data.playlistId
    });
  }
}

module.exports = CommandHandler;
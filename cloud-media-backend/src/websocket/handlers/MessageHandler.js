const PlaylistHandler = require('./PlaylistHandler');
const CommandHandler = require('./CommandHandler');

class MessageHandler {
  constructor(wss) {
    this.playlistHandler = new PlaylistHandler(wss);
    this.commandHandler = new CommandHandler(wss);
  }

  async handleAdminMessage(data, ws) {
    console.log('Admin message received:', data);

    switch (data.type) {
      case 'playlist':
        switch (data.action) {
          case 'send':
            const success = await this.playlistHandler.handleSendPlaylist(data);
            ws.send(JSON.stringify({
              type: 'playlistSent',
              success
            }));
            break;
          default:
            console.log('Unknown playlist action:', data.action);
            break;
        }
        break;

      case 'command':
        await this.commandHandler.handleCommand(data);
        ws.send(JSON.stringify({
          type: 'commandStatus',
          token: data.token,
          command: data.command,
          success: true
        }));
        break;

      case 'playlistStatus':
        await this.playlistHandler.handlePlaylistStatus(data, ws.deviceToken);
        break;

      default:
        console.log('Unknown message type:', data.type);
        break;
    }
  }
}

module.exports = MessageHandler;
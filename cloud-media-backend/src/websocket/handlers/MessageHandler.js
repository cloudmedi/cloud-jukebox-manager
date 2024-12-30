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
        // Handle command messages including screenshot
        const success = await this.commandHandler.handleCommand({
          ...data,
          token: data.token
        });
        
        // Send command status back to admin client
        ws.send(JSON.stringify({
          type: 'commandStatus',
          token: data.token,
          command: data.command,
          success,
          data: data.data // Include any additional data like screenshot
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
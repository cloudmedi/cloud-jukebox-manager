const PlaylistHandler = require('./PlaylistHandler');
const CommandHandler = require('./CommandHandler');
const ScheduleHandler = require('./ScheduleHandler');

class MessageHandler {
  constructor(wss) {
    this.playlistHandler = new PlaylistHandler(wss);
    this.commandHandler = new CommandHandler(wss);
    this.scheduleHandler = new ScheduleHandler(wss);
    this.wss = wss;
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

      case 'schedule':
        switch (data.action) {
          case 'create':
            const createSuccess = await this.scheduleHandler.handleSendSchedule(data.schedule);
            ws.send(JSON.stringify({
              type: 'scheduleSent',
              success: createSuccess
            }));
            break;
          case 'update':
            const updateSuccess = await this.scheduleHandler.handleScheduleUpdate(data.schedule);
            ws.send(JSON.stringify({
              type: 'scheduleUpdated',
              success: updateSuccess
            }));
            break;
          case 'delete':
            const deleteSuccess = await this.scheduleHandler.handleScheduleDelete(data.scheduleId, data.targets);
            ws.send(JSON.stringify({
              type: 'scheduleDeleted',
              success: deleteSuccess
            }));
            break;
          default:
            console.log('Unknown schedule action:', data.action);
            break;
        }
        break;

      case 'command':
        const commandSuccess = await this.commandHandler.handleCommand({
          ...data,
          token: data.token
        });
        ws.send(JSON.stringify({
          type: 'commandStatus',
          token: data.token,
          command: data.command,
          success: commandSuccess
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

  async handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'schedule-created':
        case 'schedule-updated':
        case 'schedule-deleted':
          this.handleScheduleMessage(ws, data);
          break;

        case 'playlist':
          if (data.action === 'send') {
            const success = await this.playlistHandler.handleSendPlaylist(data);
            ws.send(JSON.stringify({
              type: 'playlistSent',
              success
            }));
          } else {
            console.log('Unknown playlist action:', data.action);
          }
          break;

        case 'command':
          const commandSuccess = await this.commandHandler.handleCommand({
            ...data,
            token: data.token
          });
          ws.send(JSON.stringify({
            type: 'commandStatus',
            token: data.token,
            command: data.command,
            success: commandSuccess
          }));
          break;

        case 'playlistStatus':
          await this.playlistHandler.handlePlaylistStatus(data, ws.deviceToken);
          break;

        default:
          console.log('Unknown message type:', data.type);
          break;
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }

  handleScheduleMessage(ws, data) {
    if (!ws.deviceId) {
      console.error('Unauthorized schedule message');
      return;
    }

    // Schedule mesajını ilgili cihaza ilet
    this.wss.deviceHandler.sendMessageToDevice(ws.deviceId, {
      type: data.type,
      data: data.data
    });
  }
}

module.exports = MessageHandler;
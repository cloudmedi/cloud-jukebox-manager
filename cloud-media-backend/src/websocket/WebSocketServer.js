const WebSocket = require('ws');
const MessageHandler = require('./handlers/MessageHandler');
const StatusHandler = require('./handlers/StatusHandler');
const AdminConnectionHandler = require('./handlers/AdminConnectionHandler');
const DeviceConnectionHandler = require('./handlers/DeviceConnectionHandler');
const Device = require('../models/Device');
const ScheduleHandler = require('./handlers/ScheduleHandler');
const PlaybackHistory = require('../models/PlaybackHistory');
const mongoose = require('mongoose');

class WebSocketServer {
  constructor(server) {
    console.log('WebSocket sunucusu başlatılıyor...');
    this.wss = new WebSocket.Server({ server });
    this.messageHandler = new MessageHandler(this);
    this.statusHandler = new StatusHandler(this);
    this.adminHandler = new AdminConnectionHandler(this);
    this.deviceHandler = new DeviceConnectionHandler(this);
    this.scheduleHandler = new ScheduleHandler(this);
    this.initialize();
  }

  initialize() {
    this.wss.on('connection', async (ws, req) => {
      console.log('New WebSocket connection attempt');

      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      if (req.url === '/admin') {
        await this.adminHandler.handleConnection(ws);
      } else {
        await this.deviceHandler.handleConnection(ws);
      }
    });

    this.startHeartbeat();
  }

  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach(ws => {
        if (ws.isAlive === false) {
          console.log('Client terminated due to heartbeat failure');
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping(() => {});
      });
    }, 30000);
  }

  async handleDeviceMessage(token, message) {
    console.log(`Handling device message from ${token}:`, message);
    
    switch (message.type) {
      case 'status':
        await this.statusHandler.handleOnlineStatus(token, message.isOnline);
        break;

      case 'downloadProgress':
        console.log('📥 Download Progress Message Received:', {
          deviceToken: token,
          totalSongs: message.data.totalSongs,
          completedSongs: message.data.completedSongs,
          currentSong: message.data.songProgress?.current?.name || 'Unknown',
          progress: `${message.data.progress}%`,
          status: message.data.status
        });

        // İndirme durumunu statusHandler'a ilet
        const targetDevice = await Device.findOne({ token });
        if (targetDevice) {
          await this.statusHandler.handleDownloadProgress(message, targetDevice);
        }
        break;

      case 'deviceStatus':
        // Cihazın oynatma durumunu güncelle
        const playingDevice = await Device.findOne({ token: token });
        if (playingDevice) {
          playingDevice.isPlaying = message.isPlaying;
          await playingDevice.save();
        }
        
        // Cihazın oynatma durumunu admin paneline ilet
        this.broadcastToAdmins({
          type: 'deviceStatus',
          token: token,
          isPlaying: message.isPlaying
        });
        break;

      case 'playlistStatus':
        await this.statusHandler.handlePlaylistStatus(token, message);
        break;

      case 'playbackStatus':
        try {
          // Admin paneline detaylı playback durumunu ilet
          this.broadcastToAdmins({
            type: 'playbackStatus',
            token: token,
            data: message.data
          });

          // Eğer şarkı tamamlandıysa PlaybackHistory'ye kaydet
          if (message.data.completed) {
            const device = await Device.findOne({ token });
            if (device) {
              // Şarkı başlangıç zamanını al
              const startedAt = new Date(message.data.startedAt);
              
              // Gerçek çalma süresini al
              const playDuration = message.data.playDuration;

              // PlaybackHistory'ye kaydet
              await PlaybackHistory.create({
                deviceId: device._id,
                songId: message.data.songId,
                playedAt: startedAt,
                playDuration: playDuration,
                completed: true
              });

              console.log(`Playback history saved for device ${token}, song ${message.data.songId}, duration: ${playDuration}s`);
            }
          }
        } catch (error) {
          console.error('Error handling playback status:', error);
        }
        break;

      case 'volume':
        const device = await Device.findOne({ token });
        if (!device) return;

        await device.setVolume(message.volume);
        this.broadcastToAdmins({
          type: 'deviceStatus',
          token: token,
          volume: message.volume
        });
        break;

      case 'screenshot':
        console.log('Screenshot received from device:', token);
        this.broadcastToAdmins({
          type: 'screenshot',
          token: token,
          data: message.data
        });
        break;

      case 'error':
        this.broadcastToAdmins({
          type: 'deviceError',
          token: token,
          error: message.error
        });
        break;

      default:
        console.log('Unknown message type:', message.type);
        break;
    }
  }

  broadcastToAdmins(message) {
    console.log('Broadcasting to admins:', message);
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.isAdmin) {
        client.send(JSON.stringify(message));
        console.log('Message sent to admin client');
      }
    });
  }

  sendMessageToDevice(token, message) {
    console.log(`[WebSocket] Attempting to send message to device ${token}:`, message);
    let sent = false;
    this.wss.clients.forEach(client => {
      if (client.deviceToken === token && client.readyState === WebSocket.OPEN) {
        try {
          const messageToSend = JSON.stringify({
            type: message.type,
            data: message.data
          });
          console.log(`[WebSocket] Formatted message:`, messageToSend);
          client.send(messageToSend);
          sent = true;
          console.log(`[WebSocket] Message successfully sent to device ${token}`);
        } catch (error) {
          console.error(`[WebSocket] Error sending message to device ${token}:`, error);
        }
      }
    });
    if (!sent) {
      console.log(`[WebSocket] No active connection found for device ${token}`);
    }
    return sent;
  }

  findDeviceWebSocket(token) {
    let foundWs = null;
    this.wss.clients.forEach(ws => {
      if (ws.deviceToken === token) {
        foundWs = ws;
      }
    });
    return foundWs;
  }

  handleMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'schedule':
          this.messageHandler.handleScheduleMessage(ws, data);
          break;
        case 'playlist':
          this.messageHandler.handlePlaylistMessage(ws, data);
          break;
        case 'command':
          this.messageHandler.handleCommandMessage(ws, data);
          break;
        default:
          console.log('Unknown message type:', data.type);
          break;
      }
    } catch (error) {
      console.error('Message handling error:', error);
    }
  }
}

module.exports = WebSocketServer;
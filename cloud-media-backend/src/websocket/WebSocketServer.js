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

    // Batch işleme için queue
    this.batchQueue = new Map(); // Device bazlı queue
    this.batchSize = 10;
    this.batchTimeout = 5000; // 5 saniye
    this.batchTimers = new Map();
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
    
    try {
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
          await this.handlePlaybackStatus(token, message);
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
    } catch (error) {
      console.error(`Error handling message from device ${token}:`, error);
      // Hatayı client'a bildir
      this.sendErrorToDevice(token, {
        type: 'error',
        error: 'Message handling failed'
      });
    }
  }

  async handlePlaybackStatus(token, message, retryCount = 3) {
    try {
      // Admin paneline detaylı playback durumunu ilet
      this.broadcastToAdmins({
        type: 'playbackStatus',
        token: token,
        data: message.data
      });

      // Eğer şarkı tamamlandıysa kaydet
      if (message.data.completed) {
        const device = await Device.findOne({ token });
        if (!device) {
          throw new Error(`Device not found: ${token}`);
        }

        if (!this.validatePlaybackData(message.data)) {
          throw new Error('Invalid playback data');
        }

        const startedAt = new Date(message.data.startedAt);
        const playDuration = message.data.playDuration;

        // Batch queue'ya ekle
        this.queueForBatch(token, {
          deviceId: device._id,
          songId: message.data.songId,
          playedAt: startedAt,
          playDuration: playDuration,
          completed: true
        });

        console.log(`Queued playback history for device ${token}, song ${message.data.songId}`);
      }
    } catch (error) {
      console.error('Error handling playback status:', error);
      if (retryCount > 0) {
        console.log(`Retrying... (${retryCount} attempts left)`);
        setTimeout(() => {
          this.handlePlaybackStatus(token, message, retryCount - 1);
        }, 1000);
      } else {
        throw error;
      }
    }
  }

  validatePlaybackData(data) {
    // Zorunlu alanları kontrol et
    if (!data.songId || !data.startedAt || typeof data.playDuration !== 'number') {
      return false;
    }

    // Süre kontrolü
    if (data.playDuration < 0 || data.playDuration > 24 * 60 * 60) {
      return false;
    }

    // Tarih kontrolü
    const startedAt = new Date(data.startedAt);
    if (isNaN(startedAt.getTime())) {
      return false;
    }

    return true;
  }

  async processBatch(deviceToken) {
    const queue = this.batchQueue.get(deviceToken) || [];
    if (queue.length === 0) return;

    console.log(`Processing batch for device ${deviceToken}, ${queue.length} items`);

    try {
      // Batch'i MongoDB'ye kaydet
      await PlaybackHistory.insertMany(queue);
      console.log(`Successfully saved batch for device ${deviceToken}`);
      
      // Queue'yu temizle
      this.batchQueue.set(deviceToken, []);
      
      // Timer'ı temizle
      if (this.batchTimers.has(deviceToken)) {
        clearTimeout(this.batchTimers.get(deviceToken));
        this.batchTimers.delete(deviceToken);
      }
    } catch (error) {
      console.error(`Error processing batch for device ${deviceToken}:`, error);
      // Hata durumunda retry
      setTimeout(() => this.processBatch(deviceToken), 5000);
    }
  }

  queueForBatch(deviceToken, data) {
    // Mevcut queue'yu al veya yeni oluştur
    const queue = this.batchQueue.get(deviceToken) || [];
    queue.push(data);
    this.batchQueue.set(deviceToken, queue);

    // Queue boyutu limit'e ulaştıysa hemen işle
    if (queue.length >= this.batchSize) {
      this.processBatch(deviceToken);
      return;
    }

    // Timer'ı güncelle
    if (this.batchTimers.has(deviceToken)) {
      clearTimeout(this.batchTimers.get(deviceToken));
    }

    // Yeni timer oluştur
    const timer = setTimeout(() => {
      this.processBatch(deviceToken);
    }, this.batchTimeout);

    this.batchTimers.set(deviceToken, timer);
  }

  sendErrorToDevice(token, error) {
    this.wss.clients.forEach(client => {
      if (client.deviceToken === token && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(error));
      }
    });
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
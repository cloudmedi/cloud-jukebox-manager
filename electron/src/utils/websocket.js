const WebSocket = require('ws');
const { app } = require('electron');

const WS_SERVER = 'ws://localhost:5000'; // Geliştirme için local
let ws = null;
let reconnectTimeout = null;
const RECONNECT_DELAY = 5000;

function connectWebSocket(token) {
  if (ws) {
    ws.terminate();
  }

  ws = new WebSocket(`${WS_SERVER}?token=${token}`);

  ws.on('open', () => {
    console.log('WebSocket connected');
    clearTimeout(reconnectTimeout);
    
    // Cihaz durumunu bildir
    sendStatus('online');
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      handleMessage(message);
    } catch (error) {
      console.error('Message handling error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected');
    scheduleReconnect();
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (!reconnectTimeout) {
    reconnectTimeout = setTimeout(() => {
      connectWebSocket();
    }, RECONNECT_DELAY);
  }
}

function sendStatus(status) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'status',
      data: {
        status,
        timestamp: new Date().toISOString()
      }
    }));
  }
}

function handleMessage(message) {
  switch (message.type) {
    case 'command':
      handleCommand(message.data);
      break;
    case 'playlist':
      handlePlaylist(message.data);
      break;
    case 'announcement':
      handleAnnouncement(message.data);
      break;
    default:
      console.log('Unknown message type:', message.type);
  }
}

function handleCommand(command) {
  // Command handler implementasyonu gelecek
  console.log('Received command:', command);
}

function handlePlaylist(playlist) {
  // Playlist handler implementasyonu gelecek
  console.log('Received playlist:', playlist);
}

function handleAnnouncement(announcement) {
  // Announcement handler implementasyonu gelecek
  console.log('Received announcement:', announcement);
}

// Uygulama kapanırken bağlantıyı temizle
app.on('before-quit', () => {
  if (ws) {
    sendStatus('offline');
    ws.close();
  }
});

module.exports = {
  connectWebSocket,
  sendStatus
};
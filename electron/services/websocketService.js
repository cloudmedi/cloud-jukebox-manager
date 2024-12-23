class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.isConnecting = false;
    this.token = null;
    this.messageHandlers = new Map();
    this.connect();
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:5000/admin');

    this.ws.onopen = () => {
      console.log('Admin WebSocket bağlantısı kuruldu');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket bağlantısı kapandı, yeniden bağlanılıyor...');
      setTimeout(() => this.connect(), this.reconnectInterval);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(message) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.log('Unhandled message type:', message.type);
    }
  }

  addMessageHandler(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  removeMessageHandler(type) {
    this.messageHandlers.delete(type);
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket bağlantısı kurulamadı');
    }
  }

  updatePlaylistStatus(status, playlistId) {
    this.sendMessage({
      type: 'playlistStatus',
      status: status,
      playlistId: playlistId
    });
    console.log('Playlist durumu güncellendi:', status);
  }
}

const websocketService = new WebSocketService();
export default websocketService;

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  private constructor() {
    this.connect();
    this.setupDefaultHandlers();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private setupDefaultHandlers() {
    // Auth mesaj handler'ı
    this.addMessageHandler('auth', (message) => {
      console.log('Auth başarılı:', message);
      if (message.status === 'success') {
        // Device bilgilerini güncelle
        const { name, volume } = message.deviceInfo;
        // Volume değişikliğini ilet
        if (this.ws && volume !== undefined) {
          this.sendMessage({
            type: 'command',
            command: 'setVolume',
            volume: volume
          });
        }
      }
    });

    // Playlist mesaj handler'ı
    this.addMessageHandler('playlist', (message) => {
      console.log('Playlist alındı:', message);
      const { ipcRenderer } = require('electron');
      
      // Playlist'i renderer process'e gönder
      ipcRenderer.send('playlist-received', message.data);
      
      // Playlist durumunu güncelle
      this.sendMessage({
        type: 'playlistStatus',
        status: 'loading',
        playlistId: message.data._id
      });
    });
  }

  private connect() {
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
      setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleMessage(message: any) {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    } else {
      console.log('No handler for message type:', message.type);
    }
  }

  public addMessageHandler(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  public removeMessageHandler(type: string) {
    this.messageHandlers.delete(type);
  }

  public sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket bağlantısı kurulamadı');
    }
  }
}

const websocketService = WebSocketService.getInstance();
export default websocketService;
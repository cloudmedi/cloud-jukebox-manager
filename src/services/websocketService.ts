class WebSocketService {
  private ws: WebSocket | null = null;
  private token: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 5000;
  private connected = false;

  constructor(token: string) {
    this.token = token;
    this.connect();
  }

  private connect() {
    try {
      this.ws = new WebSocket(`ws://localhost:5000?token=${this.token}`);
      
      this.ws.onopen = () => {
        console.log('WebSocket bağlantısı kuruldu');
        this.reconnectAttempts = 0;
        this.connected = true;
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };

      this.ws.onclose = () => {
        console.log('WebSocket bağlantısı kapandı');
        this.connected = false;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket hatası:', error);
        this.connected = false;
      };
    } catch (error) {
      console.error('WebSocket bağlantı hatası:', error);
      this.connected = false;
    }
  }

  public isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Yeniden bağlanmaya çalışılıyor... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectTimeout);
    }
  }

  private handleMessage(data: any) {
    console.log('Gelen mesaj:', data);
    switch (data.type) {
      case 'PLAY':
        // Müzik çalma işlemleri
        break;
      case 'STOP':
        // Müzik durdurma işlemleri
        break;
      case 'VOLUME':
        // Ses seviyesi ayarlama
        break;
      case 'PLAYLIST_UPDATE':
        // Playlist güncelleme
        break;
      default:
        console.log('Bilinmeyen mesaj tipi:', data.type);
    }
  }

  public sendMessage(type: string, payload: any) {
    if (this.isConnected()) {
      this.ws?.send(JSON.stringify({ type, payload }));
    } else {
      console.error('WebSocket bağlantısı kapalı, mesaj gönderilemedi');
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }
}

export default WebSocketService;
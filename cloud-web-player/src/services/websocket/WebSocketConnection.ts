import { WS_CONFIG } from './WebSocketConfig';

export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;

  constructor(
    private readonly onMessage: (data: any) => void,
    private readonly onConnectionChange: (isConnected: boolean) => void
  ) {}

  public setToken(token: string) {
    console.log('Setting token:', token);
    this.token = token;
    this.connect();
  }

  public connect() {
    if (!this.token) {
      console.log('No token available, skipping connection');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.ws = new WebSocket(WS_CONFIG.URL);

    this.ws.onopen = () => {
      console.log('WebSocket connected, sending auth message');
      this.authenticate();
      this.onConnectionChange(true);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.onMessage(message);
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket connection closed');
      this.onConnectionChange(false);
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private authenticate() {
    if (this.ws && this.token) {
      console.log('Sending authentication message with token:', this.token);
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: this.token
      }));
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < WS_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket connection not available');
      this.connect();
    }
  }

  public cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
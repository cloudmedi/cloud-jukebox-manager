class WebSocketService {
  private ws: WebSocket | null = null;
  private static instance: WebSocketService;

  private constructor() {
    this.connect();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private connect() {
    const token = localStorage.getItem('device_token');
    if (!token) return;

    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.sendAuth(token);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message);
        
        if (message.type === 'auth' && message.status === 'success') {
          console.log('Authentication successful');
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private sendAuth(token: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    }
  }

  public sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

export default WebSocketService.getInstance();
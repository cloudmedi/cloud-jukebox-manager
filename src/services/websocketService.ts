class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  private constructor() {
    this.connect();
    this.setupPing();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private setupPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      return;
    }

    this.isConnecting = true;
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.ws = new WebSocket('ws://localhost:5000/admin');

    this.ws.onopen = () => {
      console.log('Admin WebSocket bağlantısı kuruldu');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'pong') return;
        this.handleMessage(message);
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket bağlantısı kapandı, yeniden bağlanılıyor...');
      this.isConnecting = false;
      this.reconnectAttempts++;
      this.scheduleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (!this.reconnectTimeout && this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    }
  }

  private handleMessage(message: any) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Handler error for message type ${message.type}:`, error);
        }
      });
    }
  }

  public addMessageHandler(type: string, handler: (data: any) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)?.add(handler);
  }

  public removeMessageHandler(type: string, handler: (data: any) => void) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    }
  }

  public sendMessage(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket bağlantısı kurulamadı, yeniden bağlanılıyor...');
      this.connect();
    }
  }

  public cleanup() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.messageHandlers.clear();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }
}

const websocketService = WebSocketService.getInstance();
export default websocketService;
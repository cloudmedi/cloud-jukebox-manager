import { toast } from "sonner";

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageHandlers = new Map();

  constructor() {
    this.connect();
    this.setupHandlers();
  }

  private setupHandlers() {
    // Mevcut handler'ları ekle
    this.addMessageHandler('deviceStatus', (message) => {
      console.log('Device status received:', message);
      // Device status güncellemelerini işle
    });

    this.addMessageHandler('commandStatus', (message) => {
      console.log('Command status received:', message);
      if (message.command === 'play' || message.command === 'pause') {
        // Play/Pause durumunu güncelle
        const successMessage = message.command === 'play' ? 'Müzik başlatıldı' : 'Müzik duraklatıldı';
        toast.success(successMessage);
      }
    });
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(() => this.connect(), 5000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket connection not ready');
    }
  }

  handleMessage(message: any) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler: Function) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`Handler error for message type ${message.type}:`, error);
        }
      });
    } else {
      console.log('Unhandled message type:', message.type);
    }
  }

  addMessageHandler(type: string, handler: Function) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)?.add(handler);
  }

  removeMessageHandler(type: string, handler: Function) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(type);
      }
    }
  }
}

export default new WebSocketService();

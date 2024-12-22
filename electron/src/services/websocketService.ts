import { ipcMain } from 'electron';
import WebSocket from 'ws';
import DeviceService from './deviceService';
import ApiService from './apiService';

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private deviceService: DeviceService;
  private apiService: ApiService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 5000;
  private pingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.deviceService = DeviceService.getInstance();
    this.apiService = ApiService.getInstance();
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  async connect(serverUrl: string): Promise<void> {
    if (this.ws) {
      this.ws.close();
    }

    const deviceInfo = this.deviceService.getDeviceInfo();
    
    // Token validasyonu
    const isValidToken = await this.apiService.validateToken(deviceInfo.token);
    if (!isValidToken) {
      try {
        await this.apiService.registerDevice(deviceInfo);
      } catch (error) {
        console.error('Device registration failed:', error);
        this.handleReconnect();
        return;
      }
    }

    this.ws = new WebSocket(serverUrl);

    this.ws.on('open', () => {
      console.log('WebSocket connection established');
      this.reconnectAttempts = 0;
      
      // Cihaz bilgilerini sunucuya gönder
      this.sendDeviceStatus('ONLINE');
      this.startPingInterval();

      ipcMain.emit('ws-status-change', { status: 'connected' });
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('WebSocket message handling error:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('WebSocket connection closed');
      this.stopPingInterval();
      this.sendDeviceStatus('OFFLINE');
      ipcMain.emit('ws-status-change', { status: 'disconnected' });
      this.handleReconnect();
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      ipcMain.emit('ws-status-change', { status: 'error', error: error.message });
    });
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'VOLUME_CHANGE':
        ipcMain.emit('volume-change', message.data);
        break;
      case 'PLAYLIST_UPDATE':
        ipcMain.emit('playlist-update', message.data);
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 30000); // Her 30 saniyede bir ping gönder
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendPing(): void {
    this.send({
      type: 'PING',
      data: {
        timestamp: Date.now()
      }
    });
  }

  private sendDeviceStatus(status: 'ONLINE' | 'OFFLINE'): void {
    const deviceInfo = this.deviceService.getDeviceInfo();
    this.send({
      type: 'DEVICE_STATUS',
      data: {
        token: deviceInfo.token,
        status,
        timestamp: Date.now()
      }
    });
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
      
      setTimeout(() => {
        this.connect('ws://localhost:5000');
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      ipcMain.emit('ws-status-change', { 
        status: 'error', 
        error: 'Maximum reconnection attempts reached' 
      });
    }
  }

  close(): void {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebSocketService;
import { ipcMain } from 'electron';
import WebSocket from 'ws';
import DeviceService from './deviceService';

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private deviceService: DeviceService;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 5000;

  private constructor() {
    this.deviceService = DeviceService.getInstance();
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  connect(serverUrl: string): void {
    if (this.ws) {
      this.ws.close();
    }

    this.ws = new WebSocket(serverUrl);
    const deviceInfo = this.deviceService.getDeviceInfo();

    this.ws.on('open', () => {
      console.log('WebSocket bağlantısı kuruldu');
      this.reconnectAttempts = 0;
      
      // Cihaz bilgilerini sunucuya gönder
      this.ws.send(JSON.stringify({
        type: 'DEVICE_REGISTER',
        data: deviceInfo
      }));

      // IPC üzerinden renderer process'e bildir
      ipcMain.emit('ws-status-change', { status: 'connected' });
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        ipcMain.emit('ws-message', message);
      } catch (error) {
        console.error('WebSocket mesaj işleme hatası:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('WebSocket bağlantısı kapandı');
      ipcMain.emit('ws-status-change', { status: 'disconnected' });
      this.handleReconnect();
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket hatası:', error);
      ipcMain.emit('ws-status-change', { status: 'error', error: error.message });
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Yeniden bağlanma denemesi ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect('ws://localhost:5000');
      }, this.reconnectTimeout);
    }
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebSocketService;
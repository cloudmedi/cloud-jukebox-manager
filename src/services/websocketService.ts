import { toast } from "@/components/ui/use-toast";

class WebSocketService {
  private ws: WebSocket | null = null;
  private token: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 5000;

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
        
        toast({
          title: "Bağlantı Kuruldu",
          description: "Sunucu ile bağlantı başarıyla kuruldu",
        });
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      };

      this.ws.onclose = () => {
        console.log('WebSocket bağlantısı kapandı');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket hatası:', error);
        toast({
          variant: "destructive",
          title: "Bağlantı Hatası",
          description: "Sunucu ile bağlantı kurulamadı",
        });
      };
    } catch (error) {
      console.error('WebSocket bağlantı hatası:', error);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Yeniden bağlanmaya çalışılıyor... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectTimeout);
    } else {
      toast({
        variant: "destructive",
        title: "Bağlantı Hatası",
        description: "Sunucu ile bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.",
      });
    }
  }

  private handleMessage(data: any) {
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
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      toast({
        variant: "destructive",
        title: "Bağlantı Hatası",
        description: "Sunucu ile bağlantı kurulamadı",
      });
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default WebSocketService;
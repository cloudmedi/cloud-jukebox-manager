const WebSocket = require('ws');
const PlaylistService = require('./playlistService');
const audioPlayer = require('./audioPlayer');

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.isConnecting = false;
    this.token = null;
    this.messageQueue = [];
  }

  connect(token) {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.token = token;

    console.log('WebSocket bağlantısı başlatılıyor...');
    this.ws = new WebSocket('ws://localhost:5000');

    this.ws.on('open', () => {
      console.log('WebSocket bağlantısı başarıyla kuruldu');
      this.isConnecting = false;
      
      // Token ile kimlik doğrulama
      this.sendAuthMessage();
      
      // Kuyruktaki mesajları gönder
      this.flushMessageQueue();
      
      // Yarım kalan indirmeleri devam ettir
      PlaylistService.resumeIncompleteDownloads(this.ws);
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    });

    this.ws.on('close', () => {
      console.log('WebSocket bağlantısı kapandı, yeniden bağlanılıyor...');
      this.isConnecting = false;
      setTimeout(() => this.connect(this.token), this.reconnectInterval);
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  sendAuthMessage() {
    const authMessage = {
      type: 'auth',
      token: this.token
    };
    this.sendMessage(authMessage);
  }

  handleMessage(message) {
    switch (message.type) {
      case 'playlist':
        switch (message.action) {
          case 'send':
            PlaylistService.handlePlaylistMessage(message, this.ws);
            break;
          case 'update':
            // Playlist güncelleme işlemleri
            break;
          case 'delete':
            // Playlist silme işlemleri
            break;
        }
        break;
        
      case 'command':
        this.handleCommand(message);
        break;
        
      case 'auth':
        this.handleAuthResponse(message);
        break;
    }
  }

  handleAuthResponse(message) {
    if (message.status === 'success') {
      console.log('Kimlik doğrulama başarılı');
      this.sendStatus({ type: 'status', isOnline: true });
      
      // Mevcut çalma durumunu geri yükle
      audioPlayer.restoreState();
    }
  }

  handleCommand(message) {
    switch (message.command) {
      case 'play':
        audioPlayer.play();
        break;
      case 'pause':
        audioPlayer.pause();
        break;
      case 'stop':
        audioPlayer.stop();
        break;
      case 'next':
        audioPlayer.playNext();
        break;
      case 'previous':
        audioPlayer.playPrevious();
        break;
      case 'setVolume':
        audioPlayer.setVolume(message.volume);
        break;
      case 'shuffle':
        audioPlayer.shuffle();
        break;
    }
  }

  sendMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  sendStatus(status) {
    this.sendMessage(status);
  }

  disconnect() {
    if (this.ws) {
      this.sendStatus({ type: 'status', isOnline: false });
      
      setTimeout(() => {
        this.ws.close();
        this.ws = null;
      }, 500);
    }
  }
}

module.exports = new WebSocketService();
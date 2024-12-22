const WebSocket = require('ws');
const PlaylistService = require('./playlistService');
const audioPlayer = require('./audioPlayer');

class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectInterval = 5000;
    this.isConnecting = false;
    this.token = null;
    this.playlistService = null;
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
      
      // Playlist servisini başlat
      this.playlistService = new PlaylistService(this.ws);
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
    console.log('Kimlik doğrulama mesajı gönderiliyor:', authMessage);
    this.ws.send(JSON.stringify(authMessage));
  }

  handleMessage(message) {
    switch (message.type) {
      case 'auth':
        this.handleAuthResponse(message);
        break;
      
      case 'command':
        this.handleCommand(message);
        break;

      case 'playlistReady':
        this.handlePlaylistReady(message);
        break;
    }
  }

  handleAuthResponse(message) {
    if (message.status === 'success') {
      console.log('Kimlik doğrulama başarılı');
      this.sendStatus({ type: 'status', isOnline: true });
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
      case 'next':
        audioPlayer.playNext();
        break;
      case 'previous':
        audioPlayer.playPrevious();
        break;
      case 'setVolume':
        audioPlayer.setVolume(message.volume);
        break;
    }
  }

  handlePlaylistReady(message) {
    // Playlist hazır olduğunda çalmaya başla
    const playbackState = audioPlayer.getPlaybackState();
    if (playbackState.playlist && playbackState.playlist._id === message.playlistId) {
      audioPlayer.play();
    }
  }

  sendStatus(status) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(status));
    }
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
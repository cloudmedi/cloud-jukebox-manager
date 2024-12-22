class Channel {
  constructor(name) {
    this.name = name;
    this.clients = new Map(); // token -> WebSocket
    this.lastActivity = Date.now();
    this.messageQueue = [];
    this.maxQueueSize = 100;
  }

  join(token, ws) {
    this.clients.set(token, ws);
    this.lastActivity = Date.now();
    console.log(`Client ${token} joined channel ${this.name}`);
    
    // Kuyruktaki mesajları gönder
    this.flushMessageQueue(token);
  }

  leave(token) {
    this.clients.delete(token);
    this.lastActivity = Date.now();
    console.log(`Client ${token} left channel ${this.name}`);
  }

  broadcast(message, excludeToken = null) {
    console.log(`Broadcasting to channel ${this.name}:`, message);
    
    // Mesajı sıkıştır
    const compressedMessage = this.compressMessage(message);
    
    // Toplu gönderim için mesajları grupla
    const batch = [];
    
    this.clients.forEach((ws, token) => {
      if (token !== excludeToken) {
        if (ws.readyState === 1) {
          batch.push({ ws, message: compressedMessage });
        } else {
          // Bağlantı kopuksa mesajı kuyruğa al
          this.queueMessage(token, message);
        }
      }
    });

    // Toplu gönderim yap
    this.sendBatch(batch);
  }

  send(token, message) {
    const ws = this.clients.get(token);
    if (ws && ws.readyState === 1) {
      console.log(`Sending to client ${token} in channel ${this.name}:`, message);
      const compressedMessage = this.compressMessage(message);
      ws.send(compressedMessage);
      return true;
    } else {
      // Bağlantı kopuksa mesajı kuyruğa al
      this.queueMessage(token, message);
      return false;
    }
  }

  compressMessage(message) {
    // Basit sıkıştırma: Gereksiz boşlukları kaldır
    return JSON.stringify(message).replace(/\s+/g, ' ');
  }

  queueMessage(token, message) {
    if (this.messageQueue.length >= this.maxQueueSize) {
      this.messageQueue.shift(); // En eski mesajı çıkar
    }
    this.messageQueue.push({ token, message, timestamp: Date.now() });
  }

  flushMessageQueue(token) {
    const ws = this.clients.get(token);
    if (!ws || ws.readyState !== 1) return;

    const messages = this.messageQueue.filter(m => m.token === token);
    messages.forEach(m => {
      ws.send(this.compressMessage(m.message));
    });
    
    // Gönderilen mesajları kuyruktan temizle
    this.messageQueue = this.messageQueue.filter(m => m.token !== token);
  }

  sendBatch(batch) {
    // Toplu gönderim için setTimeout kullan
    setTimeout(() => {
      batch.forEach(({ ws, message }) => {
        try {
          ws.send(message);
        } catch (error) {
          console.error(`Error sending message in channel ${this.name}:`, error);
        }
      });
    }, 0);
  }

  getClientCount() {
    return this.clients.size;
  }

  isInactive(timeout = 300000) { // 5 dakika
    return Date.now() - this.lastActivity > timeout;
  }
}

module.exports = Channel;
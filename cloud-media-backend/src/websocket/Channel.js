class Channel {
  constructor(name) {
    this.name = name;
    this.clients = new Map(); // token -> WebSocket
  }

  join(token, ws) {
    this.clients.set(token, ws);
    console.log(`Client ${token} joined channel ${this.name}`);
  }

  leave(token) {
    this.clients.delete(token);
    console.log(`Client ${token} left channel ${this.name}`);
  }

  broadcast(message, excludeToken = null) {
    console.log(`Broadcasting to channel ${this.name}:`, message);
    this.clients.forEach((ws, token) => {
      if (token !== excludeToken && ws.readyState === 1) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  send(token, message) {
    const ws = this.clients.get(token);
    if (ws && ws.readyState === 1) {
      console.log(`Sending to client ${token} in channel ${this.name}:`, message);
      ws.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  getClientCount() {
    return this.clients.size;
  }
}

module.exports = Channel;
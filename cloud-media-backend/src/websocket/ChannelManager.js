const Channel = require('./Channel');

class ChannelManager {
  constructor() {
    this.channels = new Map(); // channelName -> Channel
    this.clientChannels = new Map(); // token -> Set<channelName>
    this.maxChannelsPerClient = 5;
    this.cleanupInterval = 300000; // 5 dakika

    // Otomatik temizleme işlemini başlat
    this.startCleanupInterval();
  }

  createChannel(name) {
    if (!this.channels.has(name)) {
      this.channels.set(name, new Channel(name));
      console.log(`Channel created: ${name}`);
    }
    return this.channels.get(name);
  }

  joinChannel(channelName, token, ws) {
    // Kanal limitini kontrol et
    if (this.getClientChannelCount(token) >= this.maxChannelsPerClient) {
      throw new Error(`Maximum channel limit (${this.maxChannelsPerClient}) reached for client ${token}`);
    }

    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.createChannel(channelName);
    }

    channel.join(token, ws);

    if (!this.clientChannels.has(token)) {
      this.clientChannels.set(token, new Set());
    }
    this.clientChannels.get(token).add(channelName);
  }

  leaveChannel(channelName, token) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.leave(token);
      
      const clientChannels = this.clientChannels.get(token);
      if (clientChannels) {
        clientChannels.delete(channelName);
        if (clientChannels.size === 0) {
          this.clientChannels.delete(token);
        }
      }

      // Kanalı temizle
      this.cleanupChannel(channelName);
    }
  }

  leaveAllChannels(token) {
    const channels = this.clientChannels.get(token);
    if (channels) {
      channels.forEach(channelName => this.leaveChannel(channelName, token));
    }
  }

  broadcastToChannel(channelName, message, excludeToken = null) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.broadcast(message, excludeToken);
    }
  }

  sendToClient(token, message) {
    let sent = false;
    this.clientChannels.get(token)?.forEach(channelName => {
      const channel = this.channels.get(channelName);
      if (channel && channel.send(token, message)) {
        sent = true;
      }
    });
    return sent;
  }

  getClientChannelCount(token) {
    return this.clientChannels.get(token)?.size || 0;
  }

  cleanupChannel(channelName) {
    const channel = this.channels.get(channelName);
    if (channel && channel.getClientCount() === 0) {
      this.channels.delete(channelName);
      console.log(`Empty channel removed: ${channelName}`);
    }
  }

  startCleanupInterval() {
    setInterval(() => {
      console.log('Running channel cleanup...');
      this.channels.forEach((channel, name) => {
        if (channel.isInactive()) {
          this.channels.delete(name);
          console.log(`Inactive channel removed: ${name}`);
        }
      });
    }, this.cleanupInterval);
  }
}

module.exports = ChannelManager;
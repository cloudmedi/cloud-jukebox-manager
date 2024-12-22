const Channel = require('./Channel');

class ChannelManager {
  constructor() {
    this.channels = new Map(); // channelName -> Channel
    this.clientChannels = new Map(); // token -> Set<channelName>
  }

  createChannel(name) {
    if (!this.channels.has(name)) {
      this.channels.set(name, new Channel(name));
      console.log(`Channel created: ${name}`);
    }
    return this.channels.get(name);
  }

  joinChannel(channelName, token, ws) {
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

      if (channel.getClientCount() === 0) {
        this.channels.delete(channelName);
        console.log(`Empty channel removed: ${channelName}`);
      }
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
}

module.exports = ChannelManager;
class CommandHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleCommand(data) {
    console.log('Sending command to device:', data.token);
    return this.wss.sendToDevice(data.token, data);
  }
}

module.exports = CommandHandler;
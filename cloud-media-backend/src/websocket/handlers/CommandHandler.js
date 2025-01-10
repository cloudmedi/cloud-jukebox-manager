class CommandHandler {
  constructor(wss) {
    this.wss = wss;
  }

  async handleCommand(data) {
    try {
      console.log('Sending command to device:', data.token);
      
      // Cihaz bağlantısını bul
      const deviceWs = this.wss.findDeviceWebSocket(data.token);
      
      if (!deviceWs) {
        console.error('Device not connected:', data.token);
        return false;
      }

      // Komutu gönder
      deviceWs.send(JSON.stringify({
        type: 'command',
        data: data
      }));

      return true;
    } catch (error) {
      console.error('Error sending command:', error);
      return false;
    }
  }
}

module.exports = CommandHandler;
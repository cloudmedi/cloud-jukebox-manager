class NetworkStatusService {
  constructor() {
    this.checkInterval = 5000; // 5 seconds
    this.listeners = new Set();
  }

  startMonitoring() {
    this.checkStatus();
    this.intervalId = setInterval(() => this.checkStatus(), this.checkInterval);
    
    window.addEventListener('online', () => this.notifyListeners());
    window.addEventListener('offline', () => this.notifyListeners());
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async checkStatus() {
    try {
      const online = navigator.onLine;
      if (!online) {
        this.notifyListeners({ status: 'offline', strength: 0 });
        return;
      }

      const response = await fetch('http://localhost:5000/ping', { 
        method: 'HEAD',
        timeout: 3000 
      });
      
      if (response.ok) {
        // Check response time to determine connection strength
        const responseTime = response.headers.get('x-response-time');
        const strength = responseTime < 100 ? 'high' : 'low';
        this.notifyListeners({ status: 'online', strength });
      }
    } catch (error) {
      console.error('Network check error:', error);
      this.notifyListeners({ status: 'error', strength: 'low' });
    }
  }

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(status) {
    this.listeners.forEach(listener => listener(status));
  }
}

module.exports = new NetworkStatusService();
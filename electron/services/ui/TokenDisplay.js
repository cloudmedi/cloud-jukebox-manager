const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();

class TokenDisplay {
  constructor() {
    this.tokenElement = document.getElementById('tokenDisplay');
    this.tokenValue = document.getElementById('tokenValue');
  }

  displayToken() {
    const deviceInfo = store.get('deviceInfo');
    
    if (deviceInfo && deviceInfo.token) {
      this.tokenValue.textContent = deviceInfo.token;
    } else {
      this.tokenValue.textContent = 'Token bulunamadı';
    }
  }

  hide() {
    if (this.tokenElement) {
      this.tokenElement.style.display = 'none';
    }
  }

  show() {
    if (this.tokenElement) {
      this.tokenElement.style.display = 'block';
    }
  }
}

module.exports = TokenDisplay;
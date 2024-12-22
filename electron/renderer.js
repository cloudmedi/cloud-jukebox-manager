const { ipcRenderer } = require('electron');
const os = require('os');

function getDeviceInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: JSON.stringify(os.cpus()),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    networkInterfaces: JSON.stringify(os.networkInterfaces()),
    osVersion: os.version()
  };
}

async function registerDevice() {
  try {
    // Token oluştur ve kaydet
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const deviceInfo = getDeviceInfo();

    // Token'ı MongoDB'ye kaydet
    const tokenResponse = await fetch('http://localhost:5000/api/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        deviceInfo
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Token kaydedilemedi');
    }

    // Cihazı MongoDB'ye kaydet
    const deviceResponse = await fetch('http://localhost:5000/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Device-${token}`,
        token: token,
        location: 'Unknown',
        volume: 50
      })
    });

    if (!deviceResponse.ok) {
      throw new Error('Cihaz kaydedilemedi');
    }

    // Token'ı localStorage'a kaydet
    localStorage.setItem('deviceToken', token);
    document.getElementById('device-token').textContent = token;
    document.getElementById('status').textContent = 'Registered';

    // WebSocket bağlantısını başlat
    connectWebSocket(token);

  } catch (error) {
    console.error('Kayıt hatası:', error);
    document.getElementById('status').textContent = 'Error: ' + error.message;
  }
}

function connectWebSocket(token) {
  const ws = new WebSocket(`ws://localhost:5000?token=${token}`);

  ws.onopen = () => {
    console.log('WebSocket bağlantısı kuruldu');
    document.getElementById('status').textContent = 'Connected';
  };

  ws.onclose = () => {
    console.log('WebSocket bağlantısı kapandı');
    document.getElementById('status').textContent = 'Disconnected';
    // 5 saniye sonra yeniden bağlan
    setTimeout(() => connectWebSocket(token), 5000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket hatası:', error);
    document.getElementById('status').textContent = 'Error';
  };
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
  const savedToken = localStorage.getItem('deviceToken');
  if (savedToken) {
    document.getElementById('device-token').textContent = savedToken;
    connectWebSocket(savedToken);
  } else {
    const registerButton = document.createElement('button');
    registerButton.textContent = 'Register Device';
    registerButton.onclick = registerDevice;
    document.getElementById('app').appendChild(registerButton);
  }
});
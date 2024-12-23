const Store = require('electron-store');
const store = new Store();

function handleAuth(message) {
  console.log('Handling auth message:', message);
  if (message.status === 'success') {
    store.set('deviceInfo', message.deviceInfo);
  }
}

module.exports = { handleAuth };
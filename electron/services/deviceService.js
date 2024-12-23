const os = require('os');

function getDeviceInfo() {
  const deviceInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus()[0].model,
    totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
    freeMemory: `${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`,
    networkInterfaces: Object.values(os.networkInterfaces())
      .flat()
      .filter(ni => !ni.internal && ni.family === 'IPv4')
      .map(ni => ni.address),
    osVersion: os.release()
  };
  
  console.log('Device info collected:', deviceInfo);
  return deviceInfo;
}

function generateToken() {
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('Generated new token:', token);
  return token;
}

module.exports = {
  getDeviceInfo,
  generateToken
};
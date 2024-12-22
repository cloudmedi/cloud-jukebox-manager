const si = require('systeminformation');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs/promises');

const CONFIG_PATH = path.join(app.getPath('userData'), 'device-config.json');

async function generateToken() {
  // 6 haneli benzersiz token oluştur
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getSystemInfo() {
  const [system, cpu, mem, os, disk] = await Promise.all([
    si.system(),
    si.cpu(),
    si.mem(),
    si.osInfo(),
    si.diskLayout()
  ]);

  return {
    system: {
      manufacturer: system.manufacturer,
      model: system.model,
      serial: system.serial
    },
    cpu: {
      brand: cpu.brand,
      cores: cpu.cores
    },
    memory: {
      total: mem.total,
      free: mem.free
    },
    os: {
      platform: os.platform,
      distro: os.distro,
      release: os.release
    },
    storage: disk.map(d => ({
      type: d.type,
      size: d.size
    }))
  };
}

async function setupDeviceToken() {
  try {
    // Mevcut config varsa oku
    const config = await fs.readFile(CONFIG_PATH, 'utf8')
      .then(JSON.parse)
      .catch(() => null);

    if (config && config.token) {
      return config;
    }

    // Yeni cihaz bilgileri oluştur
    const token = await generateToken();
    const systemInfo = await getSystemInfo();
    const deviceId = uuidv4();

    const deviceConfig = {
      token,
      deviceId,
      systemInfo,
      createdAt: new Date().toISOString()
    };

    // Config'i kaydet
    await fs.writeFile(CONFIG_PATH, JSON.stringify(deviceConfig, null, 2));

    return deviceConfig;
  } catch (error) {
    console.error('Device setup error:', error);
    throw error;
  }
}

module.exports = {
  setupDeviceToken,
  getSystemInfo
};
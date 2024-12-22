import os from 'os';

interface DeviceInfo {
  hostname: string;
  platform: string;
  arch: string;
  cpus: string;
  totalMemory: string;
  freeMemory: string;
  networkInterfaces: string[];
  osVersion: string;
}

export const collectDeviceInfo = (): DeviceInfo => {
  const networkInterfaces = Object.values(os.networkInterfaces())
    .flat()
    .filter((interface_): interface_ is os.NetworkInterfaceInfo => interface_ !== undefined)
    .map(interface_ => interface_.address);

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus().map(cpu => cpu.model)[0],
    totalMemory: `${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`,
    freeMemory: `${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`,
    networkInterfaces,
    osVersion: os.version()
  };
};

export const registerDevice = async (deviceInfo: DeviceInfo): Promise<{ token: string, device: any }> => {
  try {
    // 1. Token oluştur ve kaydet
    const tokenResponse = await fetch('http://localhost:5000/api/tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: Math.floor(100000 + Math.random() * 900000).toString(),
        deviceInfo
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Token kaydı başarısız oldu');
    }

    const tokenData = await tokenResponse.json();

    // 2. Cihazı kaydet
    const deviceResponse = await fetch('http://localhost:5000/api/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: deviceInfo.hostname,
        token: tokenData.token,
        location: 'Bilinmiyor',
        volume: 50
      }),
    });

    if (!deviceResponse.ok) {
      throw new Error('Cihaz kaydı başarısız oldu');
    }

    const deviceData = await deviceResponse.json();
    return { token: tokenData.token, device: deviceData };
  } catch (error) {
    console.error('Kayıt hatası:', error);
    throw error;
  }
};
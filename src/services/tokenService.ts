import type { Device, DeviceInfo } from '@/types/device';

const getDeviceInfo = (): DeviceInfo => {
  return {
    hostname: window.location.hostname,
    platform: navigator.platform,
    arch: 'unknown', // Browser'da bu bilgiye erişemiyoruz
    cpus: navigator.hardwareConcurrency?.toString() || 'unknown',
    totalMemory: 'unknown', // Browser'da bu bilgiye erişemiyoruz
    freeMemory: 'unknown', // Browser'da bu bilgiye erişemiyoruz
    networkInterfaces: [], // Browser'da bu bilgiye erişemiyoruz
    osVersion: navigator.userAgent,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    browserInfo: {
      name: navigator.userAgent.split(' ')[0],
      version: navigator.userAgent.split(' ')[1]
    }
  };
};

const generateToken = async (): Promise<string> => {
  try {
    const response = await fetch('http://localhost:5000/api/tokens/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceInfo: getDeviceInfo()
      })
    });

    if (!response.ok) {
      throw new Error('Token oluşturulamadı');
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Token generation error:', error);
    throw error;
  }
};

const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch(`http://localhost:5000/api/tokens/validate/${token}`);
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};

export const tokenService = {
  generateToken,
  validateToken,
  getDeviceInfo
};
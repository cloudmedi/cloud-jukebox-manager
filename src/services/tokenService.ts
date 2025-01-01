import type { Device, DeviceInfo } from '@/types/device';

const TOKEN_KEY = 'device_token';

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
    saveToken(data.token);
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

const refreshToken = async (): Promise<string> => {
  console.log('Refreshing token...');
  const currentToken = getToken();
  if (!currentToken) {
    return generateToken();
  }

  try {
    await fetch(`http://localhost:5000/api/tokens/${currentToken}/release`, {
      method: 'PATCH'
    });
    
    return generateToken();
  } catch (error) {
    console.error('Token refresh error:', error);
    throw error;
  }
};

const saveToken = (token: string): void => {
  console.log('Saving token to localStorage:', token);
  localStorage.setItem(TOKEN_KEY, token);
};

const getToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  console.log('Retrieved token from localStorage:', token);
  return token;
};

const removeToken = (): void => {
  console.log('Removing token from localStorage');
  localStorage.removeItem(TOKEN_KEY);
};

export const tokenService = {
  generateToken,
  validateToken,
  getDeviceInfo,
  refreshToken,
  saveToken,
  getToken,
  removeToken
};
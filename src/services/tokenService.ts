import { DeviceInfo } from '../types/device';

class TokenService {
  private readonly TOKEN_KEY = 'device_token';
  private readonly API_URL = 'http://localhost:5000/api';

  generateRandomToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async generateToken(): Promise<string> {
    console.log('Generating new token...');
    const deviceInfo = await this.getDeviceInfo();
    const token = this.generateRandomToken();
    
    try {
      console.log('Sending token registration request:', { token, deviceInfo });
      const response = await fetch(`${this.API_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          deviceInfo
        })
      });

      if (!response.ok) {
        throw new Error('Token generation failed');
      }

      await response.json(); // Verify response
      console.log('Token registered successfully:', token);
      this.saveToken(token);
      return token;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  }

  private async getDeviceInfo(): Promise<DeviceInfo> {
    return {
      hostname: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      browserInfo: {
        name: navigator.userAgent,
        version: navigator.appVersion
      }
    };
  }

  saveToken(token: string): void {
    console.log('Saving token to localStorage:', token);
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('Retrieved token from localStorage:', token);
    return token;
  }

  removeToken(): void {
    console.log('Removing token from localStorage');
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

export const tokenService = new TokenService();
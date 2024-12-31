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

  async validateToken(token: string): Promise<boolean> {
    try {
      console.log('Validating token:', token);
      const response = await fetch(`${this.API_URL}/tokens/validate/${token}`);
      const isValid = response.ok;
      console.log('Token validation result:', isValid);
      return isValid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async refreshToken(): Promise<string> {
    console.log('Refreshing token...');
    const currentToken = this.getToken();
    if (!currentToken) {
      return this.generateToken();
    }

    try {
      await fetch(`${this.API_URL}/tokens/${currentToken}/release`, {
        method: 'PATCH'
      });
      
      return this.generateToken();
    } catch (error) {
      console.error('Token refresh error:', error);
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
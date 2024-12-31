import { DeviceInfo } from '../types/device';

class TokenService {
  private readonly TOKEN_KEY = 'device_token';
  private readonly API_URL = 'http://localhost:5000/api';

  async generateToken(): Promise<string> {
    const deviceInfo = await this.getDeviceInfo();
    try {
      const response = await fetch(`${this.API_URL}/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceInfo
        })
      });

      if (!response.ok) {
        throw new Error('Token generation failed');
      }

      const data = await response.json();
      this.saveToken(data.token);
      return data.token;
    } catch (error) {
      console.error('Token generation error:', error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_URL}/tokens/validate/${token}`);
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async refreshToken(): Promise<string> {
    const currentToken = this.getToken();
    if (!currentToken) {
      return this.generateToken();
    }

    try {
      const response = await fetch(`${this.API_URL}/tokens/${currentToken}/refresh`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.saveToken(data.token);
      return data.token;
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
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

export const tokenService = new TokenService();
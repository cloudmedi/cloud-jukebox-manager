import { z } from 'zod';

// Token şeması
const deviceTokenSchema = z.string()
  .min(32)
  .regex(/^[a-f0-9]{32,64}$/i, 'Token must be a valid hexadecimal string');

// Token güvenlik sınıfı
export class TokenValidator {
  private static readonly SALT_LENGTH = 16;
  private static readonly TOKEN_LENGTH = 32;
  private static readonly MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 gün

  // Token doğrulama
  static validateToken(token: string): boolean {
    try {
      deviceTokenSchema.parse(token);
      return true;
    } catch (error) {
      console.error('Invalid device token:', error);
      return false;
    }
  }

  // Yeni token oluşturma (tarayıcı uyumlu)
  static generateToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Token yaşını kontrol et
  static isTokenExpired(token: string, creationDate: Date): boolean {
    const age = Date.now() - creationDate.getTime();
    return age > this.MAX_AGE;
  }

  // Token güvenlik seviyesini kontrol et
  static checkTokenStrength(token: string): {
    isStrong: boolean;
    reasons: string[];
  } {
    const reasons: string[] = [];

    if (token.length < 32) {
      reasons.push('Token length is too short');
    }

    if (!/[a-f0-9]{32,}/i.test(token)) {
      reasons.push('Token contains invalid characters');
    }

    // Entropy kontrolü
    const entropy = this.calculateEntropy(token);
    if (entropy < 3.5) {
      reasons.push('Token entropy is too low');
    }

    return {
      isStrong: reasons.length === 0,
      reasons
    };
  }

  // Shannon entropy hesaplama
  private static calculateEntropy(token: string): number {
    const freq: { [key: string]: number } = {};
    for (const char of token) {
      freq[char] = (freq[char] || 0) + 1;
    }

    return Object.values(freq).reduce((entropy, count) => {
      const p = count / token.length;
      return entropy - p * Math.log2(p);
    }, 0);
  }
}

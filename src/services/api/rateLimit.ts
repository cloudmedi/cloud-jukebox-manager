interface RateLimitConfig {
  maxRequests: number;
  timeWindow: number; // milisaniye
}

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 100, timeWindow: 60000 }) {
    this.config = config;
  }

  async checkRateLimit(key: string): Promise<boolean> {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = {
        tokens: this.config.maxRequests,
        lastRefill: now
      };
      this.buckets.set(key, bucket);
    }

    // Token'ları yenile
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.config.timeWindow) * this.config.maxRequests;
    
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(bucket.tokens + tokensToAdd, this.config.maxRequests);
      bucket.lastRefill = now;
    }

    // Rate limit kontrolü
    if (bucket.tokens <= 0) {
      return false;
    }

    bucket.tokens--;
    return true;
  }

  // Rate limit bilgisi
  getRateLimitInfo(key: string) {
    const bucket = this.buckets.get(key);
    if (!bucket) return null;

    return {
      remainingTokens: bucket.tokens,
      resetTime: new Date(bucket.lastRefill + this.config.timeWindow)
    };
  }
}

// API istekleri için rate limiter instance
export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,  // 1 dakikada maksimum 100 istek
  timeWindow: 60000  // 60 saniye
});

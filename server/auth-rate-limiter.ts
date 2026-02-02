// Rate limiting for authentication endpoints
// Prevents abuse of OTP and login endpoints

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();

  // Clean expired entries periodically
  constructor() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (now > entry.resetTime) {
          this.store.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }

  async increment(key: string, config: RateLimitConfig): Promise<{
    isAllowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const resetTime = now + config.windowMs;
    
    let entry = this.store.get(key);
    
    // Reset if window expired
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime };
      this.store.set(key, entry);
    }
    
    entry.count++;
    
    const isAllowed = entry.count <= config.maxAttempts;
    const remaining = Math.max(0, config.maxAttempts - entry.count);
    
    return {
      isAllowed,
      remaining,
      resetTime: entry.resetTime
    };
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async getStatus(key: string): Promise<{
    count: number;
    remaining: number;
    resetTime: number;
  } | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return {
      count: entry.count,
      remaining: Math.max(0, 15 - entry.count), // Default max attempts
      resetTime: entry.resetTime
    };
  }
}

// Global rate limiter instance
const rateLimiter = new InMemoryRateLimiter();

// Rate limit configurations
export const RATE_LIMITS = {
  FORGOT_PASSWORD: {
    perMinute: { maxAttempts: 5, windowMs: 60 * 1000 },      // 5 per minute
    perHour: { maxAttempts: 20, windowMs: 60 * 60 * 1000 }   // 20 per hour
  },
  RESEND_OTP: {
    perMinute: { maxAttempts: 3, windowMs: 60 * 1000 }       // 3 per minute
  },
  LOGIN: {
    perMinute: { maxAttempts: 10, windowMs: 60 * 1000 }      // 10 per minute
  },
  RESET_PASSWORD: {
    perMinute: { maxAttempts: 5, windowMs: 60 * 1000 }       // 5 per minute
  },
  REGISTER: {
    perMinute: { maxAttempts: 10, windowMs: 60 * 1000 }      // 10 per minute for registration checks
  }
};

// Generate rate limit keys
export function getRateLimitKey(type: string, identifier: string, ip?: string): string {
  // Combine IP and identifier for better rate limiting
  const parts = [type, identifier];
  if (ip) parts.push(ip.replace(/:/g, '-')); // Clean IPv6 addresses
  return parts.join(':');
}

// Check rate limit for an endpoint
export async function checkRateLimit(
  type: keyof typeof RATE_LIMITS,
  identifier: string,
  ip?: string
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}> {
  const limits = RATE_LIMITS[type];
  
  // Check per-minute limit
  const minuteKey = getRateLimitKey(`${type}_min`, identifier, ip);
  const minuteResult = await rateLimiter.increment(minuteKey, limits.perMinute);
  
  if (!minuteResult.isAllowed) {
    const resetIn = Math.ceil((minuteResult.resetTime - Date.now()) / 1000);
    return {
      allowed: false,
      remaining: minuteResult.remaining,
      resetTime: minuteResult.resetTime,
      error: `Too many attempts. Try again in ${resetIn} seconds.`
    };
  }
  
  // Check per-hour limit if it exists
  if ('perHour' in limits) {
    const hourKey = getRateLimitKey(`${type}_hour`, identifier, ip);
    const hourResult = await rateLimiter.increment(hourKey, limits.perHour);
    
    if (!hourResult.isAllowed) {
      const resetIn = Math.ceil((hourResult.resetTime - Date.now()) / 60000);
      return {
        allowed: false,
        remaining: hourResult.remaining,
        resetTime: hourResult.resetTime,
        error: `Hourly limit exceeded. Try again in ${resetIn} minutes.`
      };
    }
  }
  
  return {
    allowed: true,
    remaining: minuteResult.remaining,
    resetTime: minuteResult.resetTime
  };
}

// Reset rate limit for a user (e.g., after successful operation)
export async function resetRateLimit(
  type: keyof typeof RATE_LIMITS,
  identifier: string,
  ip?: string
): Promise<void> {
  const minuteKey = getRateLimitKey(`${type}_min`, identifier, ip);
  await rateLimiter.reset(minuteKey);
  
  const limits = RATE_LIMITS[type];
  if ('perHour' in limits) {
    const hourKey = getRateLimitKey(`${type}_hour`, identifier, ip);
    await rateLimiter.reset(hourKey);
  }
}

// OTP attempt tracking (separate from rate limiting)
const otpAttempts = new Map<string, { count: number; resetTime: number }>();

export function incrementOTPAttempts(token: string): {
  count: number;
  exceeded: boolean;
} {
  const now = Date.now();
  const MAX_OTP_ATTEMPTS = 5;
  const RESET_TIME = 15 * 60 * 1000; // 15 minutes
  
  let attempts = otpAttempts.get(token);
  
  if (!attempts || now > attempts.resetTime) {
    attempts = { count: 0, resetTime: now + RESET_TIME };
    otpAttempts.set(token, attempts);
  }
  
  attempts.count++;
  
  if (attempts.count > MAX_OTP_ATTEMPTS) {
    // Token is now invalid due to too many attempts
    return { count: attempts.count, exceeded: true };
  }
  
  return { count: attempts.count, exceeded: false };
}

export function resetOTPAttempts(token: string): void {
  otpAttempts.delete(token);
}

// Express middleware for rate limiting
export function createRateLimitMiddleware(type: keyof typeof RATE_LIMITS) {
  return async (req: any, res: any, next: any) => {
    const identifier = req.body.email || req.body.username || 'unknown';
    const ip = req.ip || req.connection.remoteAddress;
    
    const result = await checkRateLimit(type, identifier, ip);
    
    if (!result.allowed) {
      return res.status(429).json({
        message: result.error,
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }
    
    // Add rate limit info to response headers
    res.set({
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    next();
  };
}
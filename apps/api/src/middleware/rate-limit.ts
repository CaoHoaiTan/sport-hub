import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter.
 * Limits each IP to 100 requests per 15-minute window.
 */
const isDev = process.env.NODE_ENV !== 'production';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    errors: [
      {
        message: 'Too many requests, please try again later.',
        extensions: { code: 'RATE_LIMITED' },
      },
    ],
  },
});

/**
 * Stricter rate limiter for auth endpoints.
 * Limits each IP to 20 requests per 15-minute window.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 200 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    errors: [
      {
        message: 'Too many authentication attempts, please try again later.',
        extensions: { code: 'RATE_LIMITED' },
      },
    ],
  },
});

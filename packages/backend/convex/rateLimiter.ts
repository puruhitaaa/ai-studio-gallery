import {
  DAY,
  HOUR,
  MINUTE,
  RateLimiter,
  SECOND,
} from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

// Rate limit configuration: 20 generations per day
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Rate limit by authenticated user ID
  generateByUser: {
    kind: "fixed window",
    rate: 20,
    period: DAY,
  },

  // Rate limit by IP address (for anonymous users)
  generateByIp: {
    kind: "fixed window",
    rate: 20,
    period: DAY,
  },
});

// Export time constants individually to avoid barrel file issues
export const TIME_DAY = DAY;
export const TIME_HOUR = HOUR;
export const TIME_MINUTE = MINUTE;
export const TIME_SECOND = SECOND;

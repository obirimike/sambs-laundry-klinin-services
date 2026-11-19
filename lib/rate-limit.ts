import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

const rateLimiters = redis
  ? {
      auth: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "10 m"),
        prefix: "samb:auth",
        analytics: true,
        timeout: 1_000,
      }),
      registration: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        prefix: "samb:registration",
        analytics: true,
        timeout: 1_000,
      }),
      contact: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(3, "10 m"),
        prefix: "samb:contact",
        analytics: true,
        timeout: 1_000,
      }),
      booking: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "10 m"),
        prefix: "samb:booking",
        analytics: true,
        timeout: 1_000,
      }),
      account: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "10 m"),
        prefix: "samb:account",
        analytics: true,
        timeout: 1_000,
      }),
      passwordReset: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 m"),
        prefix: "samb:password-reset",
        analytics: true,
        timeout: 1_000,
      }),
      admin: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "10 m"),
        prefix: "samb:admin",
        analytics: true,
        timeout: 1_000,
      }),
      recruitment: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "15 m"),
        prefix: "samb:recruitment",
        analytics: true,
        timeout: 1_000,
      }),
      applicationTracking: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "10 m"),
        prefix: "samb:tracking",
        analytics: true,
        timeout: 1_000,
      }),
    }
  : null;

export type RateLimitPolicy =
  | "auth"
  | "registration"
  | "contact"
  | "booking"
  | "account"
  | "passwordReset"
  | "admin"
  | "recruitment"
  | "applicationTracking";

const POLICY_LIMITS: Record<RateLimitPolicy, { max: number; windowMs: number }> = {
  auth: { max: 10, windowMs: 10 * 60_000 },
  registration: { max: 5, windowMs: 10 * 60_000 },
  contact: { max: 3, windowMs: 10 * 60_000 },
  booking: { max: 10, windowMs: 10 * 60_000 },
  account: { max: 10, windowMs: 10 * 60_000 },
  passwordReset: { max: 5, windowMs: 10 * 60_000 },
  admin: { max: 30, windowMs: 10 * 60_000 },
  recruitment: { max: 5, windowMs: 15 * 60_000 },
  applicationTracking: { max: 10, windowMs: 10 * 60_000 },
};

// In-memory rate limit fallback when Upstash Redis is not configured
const memoryRateStore = new Map<string, { count: number; reset: number }>();

export function getRequestIdentifier(request: Request, suffix?: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

  return suffix ? `${ip}:${suffix}` : ip;
}

export async function limitRequest(
  request: Request,
  policy: RateLimitPolicy,
  suffix?: string
) {
  const identifier = getRequestIdentifier(request, suffix);

  if (!rateLimiters) {
    const config = POLICY_LIMITS[policy];
    const key = `${policy}:${identifier}`;
    const now = Date.now();
    const existing = memoryRateStore.get(key);

    if (!existing || existing.reset <= now) {
      const reset = now + config.windowMs;
      memoryRateStore.set(key, { count: 1, reset });
      return {
        success: true,
        limit: config.max,
        remaining: config.max - 1,
        reset,
      };
    }

    existing.count += 1;
    const remaining = Math.max(0, config.max - existing.count);
    return {
      success: existing.count <= config.max,
      limit: config.max,
      remaining,
      reset: existing.reset,
    };
  }

  return rateLimiters[policy].limit(identifier);
}

export function rateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}) {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
    "Retry-After": String(
      Math.max(0, Math.ceil((result.reset - Date.now()) / 1000))
    ),
  };
}

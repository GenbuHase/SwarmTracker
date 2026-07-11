import { createRedis } from "./redis";

export type RateLimitResult = {
  /** False when this attempt exceeds the limit. */
  ok: boolean;
  count: number;
};

/**
 * Increment a sliding fixed-window counter in KV.
 * When Redis is unavailable, fails open (allows the request).
 */
export async function consumeRateLimit(options: {
  key: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const redis = createRedis();
  if (!redis) {
    return { ok: true, count: 0 };
  }

  const redisKey = `ratelimit:${options.key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, options.windowSeconds);
  }

  return {
    ok: count <= options.limit,
    count,
  };
}

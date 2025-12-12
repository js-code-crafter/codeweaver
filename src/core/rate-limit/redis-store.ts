import { RateLimitStore, RateLimitRecord } from "./basic-types";
import { Redis } from "ioredis";

/**
 * Redis-backed rate limit store.
 * Uses a Lua script to perform atomic refill + consume operations.
 */
export class RedisRateLimitStore implements RateLimitStore {
  private redis: Redis;
  private keyPrefix = "rl:bucket:";

  // Lua script for atomic refill + consume
  // KEYS[1] = bucketKey
  // ARGV[1] = rateLimitAllowedCalls
  // ARGV[2] = rateLimitTimeSpan
  // ARGV[3] = now (ms)
  private luaScript = `
    local key = KEYS[1]
    local rateLimitAllowedCalls = tonumber(ARGV[1])
    local rateLimitTimeSpan = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])

    local bucket = redis.call("HMGET", key, "tokens", "resetTime", "lastUpdated", "rateLimitAllowedCalls", "rateLimitTimeSpan")
    local tokens = tonumber(bucket[1] or rateLimitAllowedCalls)
    local resetTime = tonumber(bucket[2] or now)
    local lastUpdated = tonumber(bucket[3] or now)
    rateLimitAllowedCalls = tonumber(bucket[4] or rateLimitAllowedCalls)
    rateLimitTimeSpan = tonumber(bucket[5] or rateLimitTimeSpan)

    local elapsed = now - resetTime
    if elapsed > rateLimitTimeSpan then
      resetTime = now
      tokens = rateLimitAllowedCalls
    end if tokens > 0 then
      tokens = tokens - 1 // consume
    end
    lastUpdated = now
    
    redis.call("HMSET", key, "tokens", tokens, "resetTime", resetTime, "lastUpdated", lastUpdated, "rateLimitAllowedCalls", rateLimitAllowedCalls, "rateLimitTimeSpan", rateLimitTimeSpan)
    return {1, tokens, resetTime, lastUpdated }
  `;

  constructor(
    options: {
      host?: string;
      port?: number;
      password?: string;
      db?: number;
    } = {}
  ) {
    this.redis = new Redis(options);
  }

  /**
   * Remove a rate limit bucket.
   * @param bucketId - rate limit bucket identifier
   * @returns A promise that resolves when the bucket is removed
   */
  remove(bucketId: string): Promise<void> {
    this.redis.del(this.bucketKey(bucketId));
    return Promise.resolve();
  }

  /**
   * Remove all rate limit buckets.
   * Flushes the entire Redis database.
   * Use with caution in a shared Redis instance.
   * @returns A promise that resolves when all buckets are removed
   */
  removeAll(): Promise<void> {
    this.redis.flushdb();
    return Promise.resolve();
  }

  /**
   * Generate a Redis key for the given rate limit bucket.
   * @param bucketId - rate limit bucket identifier
   * @returns Redis key for the bucket
   */
  private bucketKey(bucketId: string) {
    return this.keyPrefix + encodeURIComponent(bucketId);
  }

  async getBucket(
    bucketId: string,
    rateLimitAllowedCalls: number,
    rateLimitTimeSpan: number
  ): Promise<RateLimitRecord> {
    const key = this.bucketKey(bucketId);
    const now = Date.now();

    const result = await this.redis.eval(
      this.luaScript,
      key,
      rateLimitAllowedCalls,
      rateLimitTimeSpan,
      now
    );

    const [ok, tokens, resetTime, lastUpdated] = result as [
      number,
      number,
      number,
      number
    ];
    if (ok !== 1) {
      // Fallback: reset bucket
      const bucket: RateLimitRecord = {
        bucketId,
        rateLimitAllowedCalls,
        tokens: rateLimitAllowedCalls,
        resetTime: now,
        lastUpdated: now,
        rateLimitTimeSpan,
      };
      await this.redis.hmset(key, {
        tokens: String(bucket.tokens),
        resetTime: String(bucket.resetTime),
        lastUpdated: String(bucket.lastUpdated),
        rateLimitAllowedCalls: String(bucket.rateLimitAllowedCalls),
        rateLimitTimeSpan: String(bucket.rateLimitTimeSpan),
      });
      return bucket;
    }
    return {
      bucketId,
      rateLimitAllowedCalls,
      rateLimitTimeSpan,
      tokens,
      resetTime,
      lastUpdated,
    };
  }

  /**
   * Optional: cleanly close Redis connection.
   */
  quit() {
    return this.redis.quit();
  }
}

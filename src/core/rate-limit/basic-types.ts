/**
 * Rate limit bucket.
 */
export type RateLimitRecord = {
  bucketId: string;
  rateLimitAllowedCalls: number;
  rateLimitTimeSpan: number;
  tokens: number;
  resetTime: number;
  lastUpdated: number;
};

/**
 * Abstract store interface for rate limit buckets.
 * Implementations can be in-memory (single instance) or Redis-backed
 * (shared across multiple instances).
 */
export interface RateLimitStore {
  /**
   * Retrieve the bucket. If it doesn't exist, initialize it
   * with the provided capacity and window.
   * @param bucketId- identifier for the bucket
   * @param rateLimitAllowedCalls - bucket capacity (max tokens)
   * @param rateLimitTimeSpan - refill window in milliseconds
   * @returns A promise that resolves to the bucket record
   */
  getBucket(
    bucketId: string,
    rateLimitAllowedCalls: number,
    rateLimitTimeSpan: number
  ): Promise<RateLimitRecord>;

  /**
   * Remove a bucket
   * @param bucketId - bucket identifier
   */
  remove(bucketId: string): Promise<void>;

  /**
   * Remove all buckets
   */
  removeAll(): Promise<void>;
}

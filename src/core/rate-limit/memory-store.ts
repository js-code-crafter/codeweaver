import { RateLimitStore, RateLimitRecord } from "./basic-types";

/**
 * In-memory rate limit store (per-process).
 * Suitable for single-instance deployments or local testing.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, RateLimitRecord> = new Map();

  /**
   * Retrieve (or initialize) the bucket.
   * If there is no existing bucket, create one with full capacity.
   * @param userId - user identifier
   * @param rateLimitAllowedCalls - bucket capacity
   * @param rateLimitTimeSpan - refill window
   * @returns Promise resolving to the bucket
   */
  async getBucket(
    bucketId: string,
    rateLimitAllowedCalls: number,
    rateLimitTimeSpan: number
  ): Promise<RateLimitRecord> {
    let bucket = this.store.get(bucketId);
    const now = Date.now();
    if (bucket == null) {
      bucket = {
        bucketId,
        rateLimitAllowedCalls,
        tokens: rateLimitAllowedCalls,
        resetTime: now,
        lastUpdated: now,
        rateLimitTimeSpan,
      };
      this.store.set(bucketId, bucket);
      return bucket;
    }

    const elapsed = now - bucket.resetTime;
    if (elapsed > bucket.rateLimitTimeSpan) {
      bucket.resetTime = now;
      bucket.tokens = bucket.rateLimitAllowedCalls;
    } else if (bucket.tokens > 0) {
      bucket.tokens--;
    }
    bucket.lastUpdated = now;

    this.store.set(bucketId, bucket);
    return bucket;
  }

  /**
   * Remove a bucket
   * @param bucketId - bucket identifier
   */
  async remove(bucketId: string): Promise<void> {
    this.store.delete(bucketId);
  }

  /**
   * Remove all buckets
   */
  async removeAll(): Promise<void> {
    this.store.clear();
  }
}

import { AsyncCache } from "utils-decorators";
import { Redis } from "ioredis";

/**
 * A Redis-backed cache adapter implementing AsyncCache<T | null>.
 * This wraps a Redis instance and provides a similar API to MapAsyncCache.
 */
export class RedisCache<T> implements AsyncCache<T> {
  public constructor(
    private cache?: Redis,
    private capacity?: number,
    private namespace?: string
  ) {
    this.cache = this.cache ?? new Redis();
    this.capacity = this.capacity ?? Number.POSITIVE_INFINITY;
    this.namespace = this.namespace ?? "redis";
  }

  private keyFor(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Asynchronously set a value by key.
   * If value is null, delete the key to represent "not present".
   * Capacity is not strictly enforced in Redis on a per-key basis here; you
   * could leverage Redis max memory and eviction policies for that.
   */
  async set(key: string, value: T): Promise<void> {
    const k = this.keyFor(key);

    if (value != null) {
      if (await this.has(key)) {
        await this.cache?.set(k, JSON.stringify(value));
      } else {
        if (
          (this.capacity ?? Number.POSITIVE_INFINITY) >
          ((await this.cache?.dbsize()) ?? 0)
        ) {
          await this.cache?.set(k, JSON.stringify(value));
        }
      }
    } else {
      await this.cache?.del(k);
    }
  }

  /**
   * Asynchronously get a value by key.
   * - If the key exists, returns the parsed value.
   * - If the key does not exist, returns null to satisfy Promise<T | null>.
   */
  async get(key: string): Promise<T> {
    const k = this.keyFor(key);
    const raw = (await this.cache?.get(k)) ?? null;
    if (raw == null) {
      return null as T;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  /**
   * Asynchronously delete a value by key.
   */
  async delete(key: string): Promise<void> {
    await this.cache?.del(this.keyFor(key));
  }

  /**
   * Asynchronously check if a key exists in the cache.
   */
  async has(key: string): Promise<boolean> {
    const exists = await this.cache?.exists(this.keyFor(key));
    return exists === 1;
  }

  /**
   * Asynchronously clear the cache (namespace-scoped).
   * Use with caution in a shared Redis instance.
   */
  async clear(key: string): Promise<void> {
    // Optional: implement namespace-wide clear if needed
    // This simple example uses a pattern-based approach for a full clear.
    const pattern = `${this.namespace}:*${key ? "" : ""}`;
    const stream = this.cache?.scanStream({ match: pattern });
    const pipeline = this.cache?.pipeline();
    stream?.on("data", (keys: string[]) => {
      if (keys.length) {
        pipeline?.del(keys);
      }
    });
    await new Promise<void>((resolve, reject) => {
      stream?.on("end", async () => {
        await pipeline?.exec();
        resolve();
      });
      stream?.on("error", (err) => reject(err));
    });
  }

  /**
   * Optional: gracefully close the Redis connection.
   */
  async close(): Promise<void> {
    await this.cache?.quit();
  }
}

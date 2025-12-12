import { AsyncCache } from "./basic-types";

/**
 * A simple in-memory map-based cache implementing AsyncCache<T>.
 * This is a straightforward wrapper around a Map<string, T>.
 */
export class MapAsyncCache<T> implements AsyncCache<T> {
  private startTimeMs?: number;

  public constructor(
    private capacity?: number,
    private durationMs?: number,
    private cache?: Map<string, T>
  ) {
    this.startTimeMs = this.startTimeMs ?? Date.now();
    this.durationMs = this.durationMs ?? Number.POSITIVE_INFINITY;
    this.capacity = this.capacity ?? Number.POSITIVE_INFINITY;
    this.cache = this.cache ?? new Map<string, T>();
  }

  public async size(): Promise<number> {
    return await this.cache!.size;
  }

  public async keys(): Promise<string[]> {
    return await Array.fromAsync(this.cache?.keys() ?? []);
  }

  public async values(): Promise<T[]> {
    return await Array.fromAsync(this.cache?.values() ?? []);
  }

  public async entries(): Promise<[string, T][]> {
    return await Array.fromAsync(this.cache?.entries() ?? []);
  }

  /**
   * Whether the cache is still valid.
   * This is a computed property that returns true if the cache
   * has not yet expired, and false otherwise.
   * @returns true if the cache is still valid, false otherwise
   */
  public get isValid(): boolean {
    return this.startTimeMs! + this.durationMs! > Date.now();
  }

  /**
   * Reset the cache if it has expired.
   * @returns true if the cache was reset, false otherwise
   */
  public async resetIfExpired(): Promise<boolean> {
    if (this.isValid == false) {
      await this.cache?.clear();
      this.startTimeMs = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Asynchronously set a value by key.
   * @param key The cache key
   * @param value The value to cache
   */
  public async set(key: string, value: T): Promise<void> {
    if ((await this.resetIfExpired()) == true) return;
    if (value != null) {
      if (this.cache?.has(key)) {
        await this.cache?.set(key, value);
      } else {
        if (
          (this.capacity ?? Number.POSITIVE_INFINITY) > (this.cache?.size ?? 0)
        ) {
          await this.cache?.set(key, value);
        }
      }
    } else {
      await this.cache?.delete(key);
    }
  }

  /**
   * Asynchronously get a value by key.
   *
   * @param key The cache key
   * - If the key exists, returns the value.
   * - If the key does not exist, returns null.
   */
  public async get(key: string): Promise<T | null> {
    if (await this.cache?.has(key)) {
      return (await this.cache?.get(key)) ?? null;
    }

    return null;
  }

  /**
   * Asynchronously delete a value by key.
   */
  public async delete(key: string): Promise<void> {
    if ((await this.resetIfExpired()) == true) return;
    await this.cache?.delete(key);
  }

  /**
   * Asynchronously check if a key exists in the cache.
   */
  public async has(key: string): Promise<boolean> {
    if ((await this.resetIfExpired()) == true) return false;
    return (await this.cache?.has(key)) ?? false;
  }

  /**
   * Asynchronously clear the cache.
   */
  public async clear(): Promise<void> {
    await this.cache?.clear();
  }
}

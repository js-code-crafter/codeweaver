import { AsyncCache } from "utils-decorators";

/**
 * A simple in-memory map-based cache implementing AsyncCache<T>.
 * This is a straightforward wrapper around a Map<string, T>.
 */
export class MapAsyncCache<T> implements AsyncCache<T> {
  public constructor(
    private capacity?: number,
    private cache?: Map<string, T>
  ) {
    this.capacity = this.capacity ?? Number.POSITIVE_INFINITY;
    this.cache = this.cache ?? new Map<string, T>();
  }

  /**
   * Asynchronously set a value by key.
   * @param key The cache key
   * @param value The value to cache
   */
  async set(key: string, value: T): Promise<void> {
    if (value != null) {
      if (this.cache?.has(key)) {
        this.cache?.set(key, value);
      } else {
        if (
          (this.capacity ?? Number.POSITIVE_INFINITY) > (this.cache?.size ?? 0)
        ) {
          this.cache?.set(key, value);
        }
      }
    } else {
      this.cache?.delete(key);
    }
  }

  /**
   * Asynchronously get a value by key.
   * - If the key exists, returns the value.
   * - If the key does not exist, returns undefined cast to T to satisfy the Promise<T> return type.
   *
   * Note: Returning undefined may be surprising for callers expecting a strict A/B.
   * Consider returning `T | undefined` from AsyncCache if you can adjust the interface,
   * or throw a ResponseError for "not found" depending on your usage.
   */
  async get(key: string): Promise<T> {
    if (this.cache?.has(key)) {
      return this.cache?.get(key) ?? (null as T);
    }

    return null as T;
  }

  /**
   * Asynchronously delete a value by key.
   */
  async delete(key: string): Promise<void> {
    this.cache?.delete(key);
  }

  /**
   * Asynchronously check if a key exists in the cache.
   */
  async has(key: string): Promise<boolean> {
    return this.cache?.has(key) ?? false;
  }

  /**
   * Asynchronously clear the cache.
   */
  async clear(key: string): Promise<void> {
    this.cache?.clear();
  }
}

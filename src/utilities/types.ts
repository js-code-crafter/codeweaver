import { AsyncCache } from "utils-decorators";

/**
 * Represents a standardized error response structure for API endpoints
 * @class
 * @property {number} [status] - HTTP status code
 * @property {string} [name] - Error name/type
 * @property {string} message - Human-readable error message
 * @property {string} [stack] - Error stack trace (development only)
 * @property {string} [details] - Additional error details
 */
export class ResponseError extends Error {
  public constructor(
    public message: string,
    public status?: number,
    public details?: string,
    public code?: string,
    public stack?: string
  ) {
    super(message);
  }
}

export type ReturnInfo<T> = [T | null, ResponseError | null];
export type AsyncReturnInfo<T> = Promise<[T | null, ResponseError | null]>;

export class MapAsyncCache<T> implements AsyncCache<T> {
  private cache = new Map<string, T>();

  async set(key: string, value: T): Promise<void> {
    this.cache.set(key, value);
  }

  async get(key: string): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key) as T;
    }

    // This cast allows to satisfy 'Promise<T>' branch, may return undefined
    return undefined as unknown as T;
  }

  async getNull(key: string): Promise<null> {
    return null;
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }
}

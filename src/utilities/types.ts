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

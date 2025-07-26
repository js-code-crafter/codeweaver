/**
 * Represents a standardized error response structure for API endpoints
 * @interface
 * @property {number} status - HTTP status code
 * @property {string} [name] - Error name/type
 * @property {string} message - Human-readable error message
 * @property {string} [stack] - Error stack trace (development only)
 * @property {string} [details] - Additional error details
 */
export interface ResponseError {
  status: number;
  name?: string;
  message: string;
  stack?: string;
  details?: string;
}

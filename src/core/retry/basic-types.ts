/**
 * Options for retry decorator
 */
export type RetryOptions = {
  /** number of total attempts (initial try + retries) */
  retries?: number;
  /**  delay between attempts in ms. */
  delay?: number;
  /** whether to use exponential backoff. */
  backoff?: boolean;
  /** maximum delay when using backoff (ms). */
  maxDelay?: number;
  /** add randomness to delay. */
  jitter?: boolean;
  /** optional callback invoked before each retry attempt (except for the first). */
  onRetry?: (attempt: number, error: any) => void;
  /** optional AbortSignal to cancel retries */
  signal?: AbortSignal;
  /** optional timeout for the whole operation (in ms). If provided, cancels after timeout */
  timeoutMs?: number;
};

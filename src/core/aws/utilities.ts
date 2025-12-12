export type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
};

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simple exponential backoff retry wrapper.
 * Retries the provided async function according to options.
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 1,
    baseDelayMs = 200,
    maxDelayMs = 2000,
    jitter = true,
  } = options;

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      let delay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt - 1));
      if (jitter) {
        const jitterMs = Math.random() * 100;
        delay = Math.max(0, delay + jitterMs);
      }
      await sleep(delay);
    }
  }
}

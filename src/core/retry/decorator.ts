import { RetryOptions } from "./basic-types";
import { createMethodDecorator } from "../helpers";

/**
 * Sleep for a given number of milliseconds, aborting if the signal is aborted.
 * @param ms The number of milliseconds to sleep.
 * @param signal An optional AbortSignal to abort the sleep.
 * @returns A Promise that resolves when the sleep is complete.
 * @throws An error if the signal is aborted.
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new Error("Aborted"));
    const t = setTimeout(() => resolve(), ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new Error("Aborted"));
    });
  });
}

/**
 * Introduce randomness into a delay to prevent multiple requests from being
 * sent at the same time.
 * @param delay The base delay in milliseconds.
 * @param jitter If true, introduce a random jitter of up to 50% of the delay.
 * @returns The jittered delay in milliseconds, or the original delay if jitter is false.
 */
export function jitterDelay(delay: number, jitter = true) {
  if (!jitter) return delay;
  // +/- 50% jitter
  const deviation = Math.floor(Math.random() * delay * 0.5);
  const sign = Math.random() < 0.5 ? -1 : 1;
  return Math.max(0, delay + sign * deviation);
}

/**
 * Retry decorator
 * Retry a method with exponential backoff and jitter.
 * @param options RetryOptions
 * @returns MethodDecorator
 */
export const Retry = createMethodDecorator<[RetryOptions], []>(
  async ([options], [], method, methodArgs) => {
    const {
      retries = 2,
      delay = 1000,
      backoff = false,
      maxDelay = 30000,
      jitter: useJitter = true,
      onRetry,
      signal,
      timeoutMs,
    } = options;
    let attempts = 0;
    let currentDelay = delay;
    let lastError: any;

    // If the user provided a per-call AbortSignal, respect it; otherwise use a local one
    const abortController = new AbortController();
    const combinedSignal = signal as AbortSignal | undefined;

    // If an external signal is provided, wire it to abort this operation when it aborts
    if (combinedSignal) {
      if (combinedSignal.aborted) {
        throw new Error("Operation aborted");
      }

      const onAbort = () => abortController.abort();
      combinedSignal.addEventListener("abort", onAbort);
    }

    // Optional per-call timeout
    let timeoutHandle: any;
    let timeoutReached = false;
    await new Promise<void>((_resolve, reject) => {
      if (timeoutMs != null) {
        timeoutHandle = setTimeout(() => {
          timeoutReached = true;
          reject(new Error("Operation timed out"));
        }, timeoutMs);
      }
    });

    // Run retries
    while (true) {
      // If timeout configured, race the call with timeout
      const attemptPromise = (async () => {
        attempts++;
        try {
          const result = await method.apply(this, methodArgs);
          if (timeoutHandle) clearTimeout(timeoutHandle);
          return result;
        } catch (err) {
          lastError = err;
          // If this was the last allowed attempt, rethrow
          if (attempts > retries) {
            if (timeoutHandle) clearTimeout(timeoutHandle);
            throw err;
          }
          // notify onRetry
          if (onRetry != null) {
            onRetry(attempts, err);
          }
          // compute next delay
          let nextDelay = currentDelay;
          if (backoff) {
            nextDelay = Math.min(currentDelay * 2, maxDelay);
            currentDelay = nextDelay;
          } else {
            nextDelay = currentDelay;
          }
          // apply jitter
          nextDelay = jitterDelay(nextDelay, useJitter);
          await sleep(nextDelay, combinedSignal);
          // then retry
          throw new Error("Retry"); // control flow not ideal; we re-enter loop
        }
      })();

      // We need to break out correctly; instead, handle with catch:
      try {
        const result = await attemptPromise;
        if (timeoutHandle) clearTimeout(timeoutHandle);
        return result;
      } catch (err) {
        if (timeoutReached) throw err;
        // if we caught a non-retryable error or exhausted retries, rethrow
        // We signal by checking if lastError and attempts > retries
        if (attempts > retries) {
          if (timeoutHandle) clearTimeout(timeoutHandle);
          throw lastError ?? err;
        }
        // otherwise loop to retry
        continue;
      }
    }
  }
);

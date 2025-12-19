/**
 * Event callback type for channel send event.
 * @template T - Type of the value sent through the channel.
 * @param {T} value - The value sent to the channel.
 */
export type EventCallback<T> = (value: T) => void;

/**
 * Channel class inspired by Golang channels.
 * Supports asynchronous send and receive operations,
 * optional event callback on send, and closing semantics.
 *
 * @template T - Type of the values sent through the channel.
 */
export class Channel<T> {
  private queue: T[] = [];
  private receivers: ((value: T) => void)[] = [];
  private closed = false;
  private eventCb?: EventCallback<T>;

  /**
   * Creates a new Channel.
   * @param {EventCallback<T>} [eventCb] - Optional callback triggered after each send.
   */
  public constructor(eventCb?: EventCallback<T>) {
    this.eventCb = eventCb;
  }

  /**
   * Sends a value to the channel.
   * If there are waiting receivers, delivers immediately.
   * Otherwise, buffers the value.
   * Throws if channel is closed.
   * @param {T} value - Value to send.
   * @returns {Promise<void>} Promise resolved when the send completes.
   */
  public async send(value: T): Promise<void> {
    if (this.closed) {
      throw new Error("Channel is closed");
    }
    if (this.receivers.length > 0) {
      const receiver = this.receivers.shift()!;
      receiver(value);
    } else {
      this.queue.push(value);
    }
    if (this.eventCb) {
      this.eventCb(value);
    }
  }

  /**
   * Receives a value from the channel.
   * If no buffered value, waits until one is sent.
   * Throws if channel is closed and no buffered values remain.
   * @returns {Promise<T>} Promise resolved with the next value.
   */
  public async receive(): Promise<T> {
    if (this.queue.length > 0) {
      return this.queue.shift()!;
    }
    if (this.closed) {
      throw new Error("Channel is closed");
    }
    return await new Promise<T>((resolve) => {
      this.receivers.push(resolve);
    });
  }

  /**
   * Closes the channel.
   * Further sends will throw.
   * Pending receivers receive undefined.
   */
  public close() {
    this.closed = true;
    while (this.receivers.length > 0) {
      const receiver = this.receivers.shift()!;
      receiver(undefined!); // Indicate closed channel to receivers
    }
  }
}

/**
 * Mutex class inspired by Golang sync.Mutex using Promise chaining.
 * Supports lock, scoped locking with ulock, and tryLock with timeout.
 */
export class Mutex {
  private mutex = Promise.resolve();

  /**
   * Locks the mutex asynchronously.
   * Returns a release function to unlock.
   * @returns {Promise<() => void>} Promise resolved with the unlock function.
   */
  public async lock(): Promise<() => void> {
    let release: () => void;
    const lockPromise = new Promise<void>((res) => (release = res));
    const oldMutex = this.mutex;
    this.mutex = oldMutex.then(() => lockPromise);
    await oldMutex;
    return release!;
  }

  /**
   * Executes a given task under mutex lock.
   * Ensures the mutex is released even if task throws.
   * @param {() => Promise<void> | void} task - Task to execute exclusively.
   */
  public async unlock(task: () => Promise<void> | void): Promise<void> {
    const release = await this.lock();
    try {
      await task();
    } finally {
      release();
    }
  }

  /**
   * Attempts to acquire the lock with a timeout.
   * If timeout expires, returns null.
   * Otherwise returns the unlock function.
   * @param {number} timeoutMs - Timeout in milliseconds.
   * @returns {Promise<(() => void) | null>} Unlock function or null on timeout.
   */
  public async tryLock(timeoutMs: number): Promise<(() => void) | null> {
    let timer: NodeJS.Timeout;
    const timedOut = new Promise<null>((resolve) => {
      timer = setTimeout(() => resolve(null), timeoutMs);
    });
    const lockPromise = this.lock();

    const result = await Promise.race([lockPromise, timedOut]);
    if (result === null) {
      return null;
    }
    clearTimeout(timer!);
    return result as () => void;
  }
}

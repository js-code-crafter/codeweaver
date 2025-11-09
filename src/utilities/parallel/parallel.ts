import { WorkerPool } from "./worker-pool";

/**
 * Creates a setter function that, when invoked, rebinds the captured
 * destination binding to the provided source value.
 *
 * @template T - The type of both `destination` and `source`, constrained to object types.
 * @param {T} destination - The destination value (captured by the closure).
 * @param {T} source - The source value to which `destination` will be rebound when the returned function runs.
 * @returns {() => void} A function that, when called, rebinds the captured `destination` to `source`.
 */
export function set<T extends object>(
  destination: keyof T,
  source: keyof T
): () => void {
  return () => {
    destination = source;
  };
}

/**
 * Executes multiple asynchronous or synchronous tasks in parallel and returns their results as an array.
 *
 * @template T The type of the result returned by each task.
 * @param {(() => T)[]} tasks - An array of functions, where each function returns a value or a promise.
 * @returns {Promise<T[]>} A promise that resolves to an array containing the resolved results of all tasks, preserving order.
 *
 * @example
 * const results = await parallel(
 *   () => fetchUser(1),
 *   () => fetchUser(2),
 *   fetchProduct,
 *   set(user.id, 1),
 *   set(user.name, "Bob")
 * );
 * console.log(results); // [user1, user2, user3]
 */
export async function parallel<T>(...tasks: (() => T)[]): Promise<T[]> {
  return await Promise.all(tasks.map(async (task) => task()));
}

/**
 * Simple parallel mapper.
 * Executes the provided async mapper function on each item in parallel
 * and collects the results in the same order as the input.
 *
 * @template T - Type of input items
 * @template U - Type of mapped results
 * @param items - Array of items to process
 * @param mapper - Async function that maps a T to a U (or Promise<U>)
 * @returns {Promise<U[]>} - Resolves to an array of mapped results in input order
 */
export async function parallelMap<T, U>(
  items: T[],
  mapper: (item: T, index?: number, array?: T[]) => Promise<U> | U
): Promise<U[]> {
  // Map each item to its mapped Promise and await all of them in parallel
  return await Promise.all(
    items.map(async (item, index, array) => await mapper(item, index, array))
  );
}

/**
 * Concurrency-limited parallel mapper.
 * Processes items with a configurable maximum number of concurrent operations.
 * If concurrency is Infinity or not finite, falls back to unbounded Promise.all.
 *
 * @template T - Type of input items
 * @template U - Type of mapped results
 * @param items - Array of items to process
 * @param mapper - Async function that maps a T to a U (or Promise<U>)
 * @param concurrencyLevel - number | Infinity - Max concurrent operations (default: Infinity)
 * @returns {Promise<U[]>} - Resolves to an array of mapped results in input order
 */
export async function parallelMapWithConcurrencyLevel<T, U>(
  items: T[],
  mapper: (item: T, index?: number, array?: T[]) => Promise<U> | U,
  concurrencyLevel: number = Infinity
): Promise<U[]> {
  if (!Array.isArray(items)) {
    throw new TypeError("Items must be an array");
  }

  if (concurrencyLevel <= 0) {
    throw new Error("Concurrency must be greater than 0");
  }

  // If concurrency is not finite, use the simple Promise.all approach
  if (!isFinite(concurrencyLevel)) {
    return await Promise.all(
      items.map((item) => Promise.resolve(mapper(item)))
    );
  }

  const results: U[] = new Array(items.length);
  let i = 0;

  // Create a fixed number of worker promises that pull from the shared index
  const workers = Array.from({ length: concurrencyLevel }, async () => {
    while (i < items.length) {
      const idx = i++;
      const item = items[idx];
      // Store the result in the corresponding position to preserve order
      results[idx] = await mapper(item, idx, items);
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Parallel CPU-bound mapper using a fixed-size worker pool.
 * - Distributes items to workers and collects results in input order.
 * - Each worker runs a fixed performMapping function defined inside the worker.
 *
 * Important: The mapper logic inside the worker is fixed. If you need custom per-item logic,
 * you should modify the worker to import your actual function or adapt to serialize logic.
 *
 * @template T - Input item type
 * @template R - Result type
 * @param items - Array of items to process
 * @param options - Concurrency options (default uses number of CPU cores)
 * @returns {Promise<R[]>} - Results in the same order as input
 */
export async function parallelCpuMap<T, R>(
  items: T[],
  mapperWorkerFilePath: string,
  concurrencyLevel: number = require("os").cpus().length || 1
): Promise<R[]> {
  if (!Array.isArray(items)) {
    throw new TypeError("items must be an array");
  }
  if (concurrencyLevel <= 0) {
    throw new Error("concurrency must be greater than 0");
  }

  // Instantiate a concrete pool
  const workerPool = new WorkerPool<T, R>(
    mapperWorkerFilePath,
    concurrencyLevel
  );

  try {
    // Dispatch all items and collect results in order
    const results = await workerPool.mapAll(items);
    await workerPool.close();
    return results;
  } catch (err) {
    await workerPool.close();
    throw err;
  }
}

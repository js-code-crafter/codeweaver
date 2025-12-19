import { Worker } from "worker_threads";
import os from "os";

export type Task<T> = { id: number; payload: T };
export type Result<R> = { id: number; result?: R; error?: string };

export class WorkerPool<T, R> {
  private workers: Worker[] = [];
  private poolSize: number;
  private nextId = 0;

  // Map task id -> { resolve, reject }
  private pending = new Map<
    number,
    { resolve: (r: R) => void; reject: (e: any) => void }
  >();

  constructor(workerPath: string, poolSize?: number) {
    const cores = os.cpus().length || 1;
    this.poolSize = poolSize && poolSize > 0 ? poolSize : cores;

    for (let i = 0; i < this.poolSize; i++) {
      const w = new Worker(workerPath);
      w.on("message", (msg: Result<R>) => this.handleResult(msg));
      w.on("error", (err) => this.handleError(err, i));
      w.on("exit", (code) => {
        if (code !== 0) {
          // Notify all pending promises about the exit
          for (const [, p] of this.pending) {
            p.reject(new Error(`Worker ${i} exited with code ${code}`));
          }
          this.pending.clear();
        }
      });
      this.workers.push(w);
    }
  }

  private handleResult(msg: Result<R>) {
    const { id, result, error } = msg;
    const entry = this.pending.get(id);
    if (!entry) return;
    this.pending.delete(id);
    if (error) {
      entry.reject(new Error(error));
    } else {
      entry.resolve(result as R);
    }
  }

  private handleError(err: any, workerIndex: number) {
    // Propagate error to all pending tasks assigned to this worker, if tracked
    // This simple version broadcasts the error to all pending tasks for safety.
    for (const [id, entry] of this.pending) {
      entry.reject(
        new Error(`Worker ${workerIndex} error: ${err?.message ?? err}`)
      );
    }
    this.pending.clear();
  }

  // Run a single payload through a specific worker
  run(workerIndex: number, payload: T): Promise<R> {
    const id = this.nextId++;
    const worker = this.workers[workerIndex];
    return new Promise<R>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage({ id, payload });
    });
  }

  // Map all items using a round-robin distribution across workers
  async mapAll(items: T[]): Promise<R[]> {
    if (!Array.isArray(items)) {
      throw new TypeError("Items must be an array");
    }

    const results: R[] = new Array(items.length);
    const workerCount = this.workers.length;
    const tasks: Promise<void>[] = items.map((payload, idx) => {
      const workerIndex = idx % workerCount;
      return this.run(workerIndex, payload).then((r) => {
        results[idx] = r;
      });
    });

    await Promise.all(tasks);
    return results;
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
  }
}

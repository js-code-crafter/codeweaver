import { Worker, Job } from "bullmq";
import { ConsumerConfig } from "./basic-types";

export class BullWorker<T = any> {
  private worker?: Worker;
  private config: ConsumerConfig;

  /**
   * Constructor for a BullWorker.
   * @param config - Configuration options for the worker.
   */
  constructor(config: ConsumerConfig) {
    this.config = config;
  }

  /**
   * Returns the BullMQ worker associated with this worker.
   * If the worker has not been created yet, it will be created with the given connection options.
   * @returns The BullMQ worker associated with this worker.
   */
  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        this.config.queueName,
        async (job: Job) => {
          const data = this.config.serializer?.deserialize
            ? (this.config.serializer.deserialize(job.data) as T)
            : (job.data as T);
          await this.config.processor({
            id: job.id,
            data,
            timestamp: Date.now(),
            attemptsMade: job.attemptsMade,
          });
        },
        {
          connection: this.config.connection ?? undefined,
          concurrency: this.config.concurrency ?? 1,
        }
      );
    }
    return this.worker;
  }

  /**
   * Starts the BullMQ worker.
   * The worker will process all messages published to the associated queue.
   * If the worker has not been created yet, it will be created with the given connection options.
   * @returns A promise resolved when the worker has been started.
   */
  public async start(): Promise<void> {
    this.getWorker();

    this.worker?.on("error", (err) => {
      throw err;
    });
  }

  /**
   * Stops the BullMQ worker.
   * If the worker has not been created yet, this method does nothing.
   * @returns A promise resolved when the worker has been stopped.
   */
  public async stop(): Promise<void> {
    await this.worker?.close?.();
    this.worker = undefined;
  }
}

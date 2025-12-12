import { Queue, Job } from "bullmq";
import { ProducerConfig } from "./basic-types";

export class BullQueueProducer<T = any> {
  private queue?: Queue;

  /**
   * Creates a new BullMQ producer.
   * @param config - Configuration options for the producer.
   */
  public constructor(private config: ProducerConfig) {}

  /**
   * Returns the BullMQ queue instance associated with this producer.
   * If the queue has not been created yet, it will be created with the given connection options.
   * @returns The BullMQ queue instance associated with this producer.
   */
  private getQueue(): Queue {
    if (!this.queue) {
      this.queue = new Queue(this.config.queueName, {
        connection: this.config.connection ?? undefined,
      });
    }
    return this.queue!;
  }

  /**
   * Adds a job to the queue.
   * If a serializer is provided in the producer config, it will be used to serialize the data.
   * Otherwise, the data will be passed as-is.
   * @param data - The data to serialize and add to the queue.
   * @param opts - Optional job options to add to the job.
   * @returns A promise resolved with the added job.
   */
  public async addJob(data: T, opts?: any): Promise<Job> {
    // Serialize data if serializer provided, but Bull's data field is passed as is
    const payload = this.config.serializer?.serialize
      ? this.config.serializer.serialize(data)
      : data;

    const queue = this.getQueue();
    // You can pass the raw data; a serializer is mainly for transport
    return await queue.add("job", payload, {
      ...(this.config.defaultJobOptions ?? {}),
      ...opts,
    });
  }

  /**
   * Closes the BullMQ queue associated with this producer.
   * If the queue has not been created yet, this method does nothing.
   * @returns A promise resolved when the queue has been closed.
   */
  public async close(): Promise<void> {
    await this.queue?.close?.();
    this.queue = undefined;
  }
}

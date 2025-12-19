import { Queue, JobScheduler, Worker } from "bullmq";
import { Broker, BrokerMessage } from "./basic-types";

/**
 * Topic handler function type.
 */
type TopicHandler<T = any> = (msg: BrokerMessage<T>) => Promise<void> | void;

/**
 * BullMQ message broker implementation.
 */
export class BullMqBroker implements Broker {
  private queues = new Map<string, Queue>();
  private workers = new Map<string, Worker>();
  private topicHandlers = new Map<string, Set<TopicHandler<any>>>();

  /**
   * Constructor for a BullMQ message broker.
   * @param options - Optional configuration options for the broker.
   * If provided, the connection option will be used when creating queues.
   */
  constructor(private connection?: any) {}

  /**
   * Returns a BullMQ queue for a given topic.
   * If the queue does not exist, it will be created with the given connection options.
   * @param topic - The topic to get the queue for.
   * @returns The BullMQ queue for the given topic.
   */
  private getQueueForTopic(topic: string): Queue {
    const key = `topic:${topic}`;
    if (!this.queues.has(key)) {
      const q = new Queue(key, {
        connection: this.connection,
      });
      this.queues.set(key, q);
    }
    // cast safe as Queue
    return this.queues.get(key)!;
  }

  /**
   * Returns a worker for a given topic.
   * If the worker does not exist, it will be created with the given connection options.
   * The worker will be responsible for processing all messages published to the given topic.
   * @param topic - The topic to get the worker for.
   * @returns The worker for the given topic.
   */
  private getWorkerForTopic(topic: string): Worker {
    const key = `topic:${topic}`;
    if (!this.workers.has(key)) {
      const worker = new Worker(
        key,
        async (job: any) => {
          const payload = job.data;
          const msg: BrokerMessage = {
            topic,
            payload,
            timestamp: Date.now(),
            id: job.id,
          };
          const handlers = this.topicHandlers.get(topic);
          if (handlers && handlers.size > 0) {
            for (const h of Array.from(handlers)) {
              await h(msg);
            }
          }
        },
        { connection: this.connection }
      );
      this.workers.set(key, worker);
    }
    return this.workers.get(key)!;
  }

  /**
   * Publishes a message to a topic.
   * @param topic - The topic to publish the message to.
   * @param message - The message payload to publish.
   * @param _options - Optional configuration options.
   * @returns A promise resolved when the message has been published to the topic.
   */
  public async publish<T>(
    topic: string,
    message: T,
    _options?: any
  ): Promise<void> {
    const q = this.getQueueForTopic(topic);
    await q.add("message", message);
  }

  /**
   * Subscribes a handler to a topic.
   * @param topic - The topic to subscribe to.
   * @param handler - The handler to invoke when a message is received from the topic.
   * @param _options - Optional configuration options.
   * @returns A promise resolved when the handler has been subscribed to the topic.
   */
  public async subscribe<T>(
    topic: string,
    handler: (msg: BrokerMessage<T>) => Promise<void> | void,
    _options?: any
  ): Promise<void> {
    // register handler
    if (!this.topicHandlers.has(topic))
      this.topicHandlers.set(topic, new Set());
    this.topicHandlers.get(topic)!.add(handler as TopicHandler<T>);

    // ensure a worker exists for the topic
    this.getWorkerForTopic(topic);
  }

  /**
   * Unsubscribes a handler from a topic.
   * @param topic - The topic to unsubscribe from.
   * @param handler - The handler to remove from the topic.
   * @returns A promise resolved when the handler has been removed from the topic.
   */
  public async unsubscribe<T>(
    topic: string,
    handler: (msg: BrokerMessage<T>) => Promise<void> | void
  ): Promise<void> {
    const set = this.topicHandlers.get(topic);
    if (set) {
      set.delete(handler as TopicHandler<T>);
    }
  }

  /**
   * Gracefully shuts down the broker, closing all workers and queues.
   * @returns A promise resolved when all workers and queues have been closed.
   */
  public async close(): Promise<void> {
    // graceful shutdown
    for (const w of this.workers.values()) await w.close();
    for (const q of this.queues.values()) await q.close();
    this.workers.clear();
    this.queues.clear();
    this.topicHandlers.clear();
  }
}

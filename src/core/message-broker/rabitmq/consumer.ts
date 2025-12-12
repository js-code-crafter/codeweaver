import { ChannelManager } from "./channel";
import { ConsumerConfig } from "./basic-types";

/**
 * RabbitMQ consumer.
 * @template T - The type of the message body.
 */
export class RabbitConsumer<T> {
  private cm = new ChannelManager({ url: "" });
  private config: ConsumerConfig<T>;
  private messageHandler?: (msg: {
    content: T;
    fields: any;
    properties: any;
  }) => Promise<void> | void;

  /**
   * Creates a new RabbitMQ consumer.
   * @param opts - Configuration options for the consumer.
   */
  public constructor(opts: ConsumerConfig<T>) {
    this.config = opts;
    this.cm = new ChannelManager({ url: opts.url });
  }

  /**
   * Connects to the RabbitMQ cluster and sets up the consumer.
   * Ensures the queue and exchange exist and binds the queue to the exchange.
   * @returns A promise resolved when the consumer is connected.
   */
  public async connect(): Promise<void> {
    await this.cm.connect();
    // ensure queue exists
    await this.cm.assertQueue(this.config.queue, true);
    if (this.config.exchange) {
      const type = this.config.exchangeType ?? "direct";
      // ensure exchange exists
      await this.cm.assertExchange(this.config.exchange, type, true);
      // bind queue
      const routingKey = this.config.routingKey ?? "";
      await this.cm.bindQueue(
        this.config.queue,
        this.config.exchange,
        routingKey
      );
    }
  }

  /**
   * Starts the consumer and begins consuming messages from the subscribed queue.
   * If the consumer is not already connected, it will first connect to the RabbitMQ cluster.
   * @param prefetch - Optional prefetch count to set on the channel.
   * If not specified, defaults to the value of `prefetch` in the consumer config.
   * @returns A promise resolved when the consumer is started.
   * @throws If the queue is not specified in the consumer config.
   */
  public async start(prefetch = this.config.prefetch ?? 1): Promise<void> {
    if (!this.config.queue) throw new Error("Queue must be specified");
    await this.connect();
    await this.cm.ch.prefetch(prefetch);
    await this.cm.ch.consume(this.config.queue, async (msg) => {
      if (!msg) return;
      // Deserialize message body
      let content: T;
      if (this.config?.serializer?.deserialize) {
        content = this.config.serializer.deserialize(msg.content) as T;
      } else {
        content = JSON.parse(msg.content.toString()) as T;
      }
      const payload = {
        content,
        fields: msg.fields,
        properties: msg.properties,
      };

      if (this.messageHandler) await this.messageHandler(payload);

      // Acknowledge in either auto or manual mode
      if (this.config.ackMode !== "manual") {
        this.cm.ch.ack(msg);
      }
    });
  }

  /**
   * Stops the consumer and closes the underlying Channel and Connection objects.
   * The consumer will no longer receive messages from the subscribed queue.
   * @returns A promise resolved when the consumer has been stopped.
   */
  public async stop(): Promise<void> {
    // Rudimentary stop: Cancel consumption by closing channel/connection
    await this.cm.close();
  }
}

import { ChannelManager } from "./channel";
import { ProducerConfig } from "./basic-types";
import { backoff } from "../utilities";

/**
 * RabbitMQ producer.
 * @template T - The type of the message body.
 */
export class RabbitProducer<T = any> {
  private cm = new ChannelManager({ url: "" });
  private config: ProducerConfig;

  /**
   * Creates a new RabbitMQ producer with the given configuration options.
   * @param opts - Configuration options for the producer.
   */
  public constructor(opts: ProducerConfig) {
    this.config = opts;
    this.cm = new ChannelManager({ url: opts.url });
  }

  /**
   * Connects to the RabbitMQ cluster and sets up the producer.
   * Ensures the exchange exists.
   * @returns A promise resolved when the producer is connected.
   */
  public async connect(): Promise<void> {
    await this.cm.connect();
    const ex = this.config.exchange ?? "";
    if (ex) {
      const type = this.config.exchangeType ?? "direct";
      await this.cm.assertExchange(ex, type, true);
    }
  }

  /**
   * Publishes a message to a RabbitMQ exchange.
   * If a serializer is provided in the producer config, it will be used to serialize the message body.
   * Otherwise, the message body will be serialized as JSON.
   * @param message - The message to publish with optional routing key and headers.
   * @returns A promise resolved when the message has been published.
   */
  public async publish(message: {
    body: T;
    routingKey?: string;
    headers?: any;
  }): Promise<void> {
    if (!message) throw new Error("Message required");
    if (!this.cm) throw new Error("ChannelManager not initialized");

    const bodyBuf = this.config.serializer?.serialize
      ? this.config.serializer.serialize(message.body)
      : Buffer.from(JSON.stringify(message.body));

    const routingKey = message.routingKey ?? this.config.routingKey ?? "";
    const exchange = this.config.exchange ?? "";

    // Ensure connection and exchange
    if (!this.cm) await this.connect();

    const payload = {
      exchange,
      routingKey,
      persistent: true,
      contentType: "application/json",
      payload: bodyBuf,
      headers: message.headers,
    } as any;

    // kaf way: use channel.publish
    let attempt = 0;
    while (true) {
      try {
        await this.cm.ch.publish(exchange, routingKey, bodyBuf, {
          headers: message.headers,
          persistent: true,
        });
        return;
      } catch (e) {
        attempt++;
        const max = this.config.retry?.retries ?? 5;
        if (attempt > max) throw e;
        const wait = backoff(
          attempt,
          this.config.retry?.baseMs ?? 100,
          this.config.retry?.maxMs ?? 2000
        );
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }

  /**
   * Closes the underlying ChannelManager and its associated objects.
   * @returns A promise resolved when all objects have been closed.
   */
  public async close(): Promise<void> {
    await this.cm.close();
  }
}

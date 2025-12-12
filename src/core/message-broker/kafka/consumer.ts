import { Kafka, Consumer, EachMessagePayload } from "kafkajs";
import { ConsumerConfig } from "./basic-types";
import { BrokerSerializer, getDefaultJsonSchema } from "../utilities";

/**
 * Kafka consumer
 * @see https://kafka.js.org/docs/consumer
 */
export class KafkaConsumer<T> {
  private consumer?: Consumer;
  private client: Kafka;

  /**
   * Creates a new Kafka consumer.
   * @param config - Configuration options for the consumer.
   * @param schema - Optional serializer for deserializing messages.
   * @param messageHandler - Optional message handler to invoke when a message is received.
   */
  public constructor(
    public config: ConsumerConfig,
    public schema?: BrokerSerializer<T>,
    public messageHandler?: (
      value: T,
      payload: EachMessagePayload
    ) => Promise<void> | void
  ) {
    this.client = new Kafka({
      clientId: config.clientId ?? "kafka-consumer",
      brokers: config.brokers,
    });
    this.schema = schema ?? getDefaultJsonSchema<T>();
  }

  /**
   * Connects to the Kafka cluster.
   * If the consumer is already connected, this method returns immediately.
   * Otherwise, it creates a new consumer and connects to the Kafka cluster.
   * @returns A promise resolved when the consumer is connected.
   */
  public async connect(): Promise<void> {
    if (this.consumer) return;
    this.consumer = this.client.consumer({ groupId: this.config.groupId });
    await this.consumer.connect();
  }

  /**
   * Subscribes to the given topics.
   * If the consumer is not already connected, it will first connect to the Kafka cluster.
   * By default, the consumer will subscribe to the topics from the beginning.
   * This can be overridden by passing "fromBeginning" in the config.
   * @param topics - The topics to subscribe to.
   * @returns A promise resolved when the consumer is subscribed to the topics.
   */
  public async subscribeTopics(topics: string[]): Promise<void> {
    if (!this.consumer) await this.connect();
    for (const t of topics) {
      // subscribe from beginning by default; can be overridden via eachTopic
      await this.consumer.subscribe({
        topic: t,
        fromBeginning: this.config.fromBeginning ?? false,
      });
    }
  }

  /**
   * Starts the consumer and begins consuming messages from the subscribed topics.
   * If the consumer is not already connected, it will first connect to the Kafka cluster.
   * @throws {Error} If the consumer is not connected.
   */
  public async run(): Promise<void> {
    if (!this.consumer)
      throw new Error("Consumer not connected. Call connect() first.");

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.messageHandler?.(
          this.schema.deserialize(payload.message.value),
          payload
        );
      },
    });
  }

  /**
   * Disconnects from the Kafka cluster and unsubscribes from all topics.
   * If the consumer is not currently connected, this method does nothing.
   * @returns A promise resolved when the consumer is disconnected.
   */
  public async disconnect(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = undefined;
    }
  }
}

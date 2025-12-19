import { Kafka, Producer, ProducerRecord, KafkaConfig } from "kafkajs";
import { ProducerConfig, Message } from "./basic-types";
import { backoff, getDefaultJsonSchema, BrokerSerializer } from "../utilities";

/**
 * Kafka producer
 * @see https://kafka.js.org/docs/producer
 */
export class KafkaProducer<T = any> {
  private producer?: Producer;
  private client: Kafka;

  /**
   * Creates a new Kafka producer.
   * @param config - Configuration options for the producer.
   * @param schema - Optional serializer for deserializing messages.
   * @see https://kafka.js.org/docs/producer
   */
  public constructor(
    public config: ProducerConfig,
    public schema?: BrokerSerializer<T>
  ) {
    this.schema = schema ?? getDefaultJsonSchema<T>();
    const kafkaConfig: KafkaConfig = {
      clientId: config.clientId ?? "kafka-client",
      brokers: config.brokers,
      retry: {
        retries: config.retry?.retries ?? 1,
        initialRetryTime: config.retry?.initialRetryTime ?? 300,
        maxRetryTime: config.retry?.backoffMax ?? 1000,
      },
    };

    this.client = new Kafka(kafkaConfig);
  }

  /**
   * Connects to the Kafka cluster.
   * If the producer is already connected, this method returns immediately.
   * Otherwise, it creates a new producer and connects to the Kafka cluster.
   * @returns A promise resolved when the producer is connected.
   */
  public async connect(): Promise<void> {
    if (this.producer) return;
    this.producer = this.client.producer({
      idempotent: this.config.idempotent ?? true,
      allowAutoTopicCreation: this.config.allowAutoTopicCreation ?? true,
    });
    await this.producer.connect();
  }

  /**
   * Disconnects from the Kafka cluster.
   * If the producer is not currently connected, this method does nothing.
   * @returns A promise resolved when the producer is disconnected.
   */
  public async disconnect(): Promise<void> {
    if (this.producer) {
      await this.producer.disconnect();
      this.producer = undefined;
    }
  }

  /**
   * Sends a message to the Kafka cluster.
   * If the producer is not currently connected, this method will first connect to the Kafka cluster.
   * The message will be serialized using the provided schema.
   * If the message key is provided, it will be used to determine the partition to send the message to.
   * If the message headers are provided, they will be sent with the message.
   * If the message partition is provided, the message will be sent to that partition.
   * If the message timestamp is provided, it will be used as the timestamp for the message.
   * In case of transient failures, the method will retry up to the configured number of retries.
   * @param topic - The topic to send the message to.
   * @param message - The message to send.
   * @returns A promise resolved when the message has been sent to the topic.
   */
  public async send(topic: string, message: Message<T>): Promise<void> {
    if (!this.producer) await this.connect();

    const valueBuf = this.schema.serialize(message.value);
    const payload: ProducerRecord = {
      topic,
      messages: [
        {
          key: message.key
            ? typeof message.key === "string"
              ? message.key
              : message.key.toString()
            : undefined,
          value: valueBuf,
          headers: message.headers,
          partition: message.partition,
          timestamp: message.timestamp,
        },
      ],
    };

    // Simple retry wrapper with backoff in case of transient failures
    let attempt = 0;
    while (true) {
      try {
        await this.producer!.send(payload);
        return;
      } catch (e) {
        attempt++;
        const max = this.config.retry?.retries ?? 1;
        if (attempt > max) throw e;
        const wait = backoff(attempt, 100, 3000);
        await new Promise((r) => setTimeout(r, wait));
      }
    }
  }
}

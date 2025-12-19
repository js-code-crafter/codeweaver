import { EachMessagePayload } from "kafkajs";

export type KafkaKey = string | Buffer;
export type KafkaHeaders = Record<string, string | Buffer>;

/**
 * Kafka producer config
 * @see https://kafka.js.org/docs/producer
 */
export interface ProducerConfig {
  clientId?: string;
  brokers: string[]; // ["host:port", ...]
  retry?: {
    retries?: number;
    initialRetryTime?: number;
    backoffMax?: number;
  };
  // enableIdempotence is available on producer in kafkajs
  idempotent?: boolean;
  // acks: -1, 1, 0
  allowAutoTopicCreation?: boolean;
}

/**
 * Kafka message
 */
export interface Message<T = any> {
  key?: KafkaKey;
  value: T;
  headers?: KafkaHeaders;
  partition?: number;
  timestamp?: string;
}

/**
 * Kafka consumer config
 * @see https://kafka.js.org/docs/consumer
 */
export interface ConsumerConfig {
  clientId?: string;
  brokers: string[];
  groupId: string;
  fromBeginning?: boolean;
  eachMessage?: (payload: EachMessagePayload) => Promise<void> | void;
}

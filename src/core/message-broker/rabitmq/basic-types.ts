import { BrokerSerializer } from "../utilities";

/**
 * Supported RabbitMQ exchange types.
 */
export type ExchangeType = "direct" | "fanout" | "topic" | "headers";

/**
 * Configuration options for a RabbitMQ producer.
 */
export interface ProducerConfig<T = any> {
  url: string;
  exchange?: string;
  exchangeType?: ExchangeType;
  routingKey?: string;
  confirm?: boolean;
  retry?: {
    retries?: number;
    baseMs?: number;
    maxMs?: number;
  };
  serializer?: BrokerSerializer<T>;
}

/**
 * Configuration options for a RabbitMQ consumer.
 */
export interface ConsumerConfig<T = any> {
  url: string;
  queue: string;
  exchange?: string;
  exchangeType?: ExchangeType;
  routingKey?: string;
  prefetch?: number;
  durable?: boolean;
  onMessage: (msg: {
    content: T;
    fields: any;
    properties: any;
  }) => Promise<void> | void;
  ackMode?: "auto" | "manual";
  retry?: { retries?: number; baseMs?: number; maxMs?: number };
  serializer?: BrokerSerializer<T>;
}

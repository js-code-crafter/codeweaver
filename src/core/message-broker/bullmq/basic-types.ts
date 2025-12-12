import { JobsOptions } from "bullmq";
import { BrokerSerializer } from "../utilities";

/**
 * Configuration options for a BullMQ queue.
 */
export interface QueueConfig {
  name: string;
  connection?: any; // redis options or a BullMQ connection object
  defaultJobOptions?: JobsOptions;
  limiter?: { max: number; duration: number } | undefined;
  prefix?: string;
}

/**
 * Configuration options for a BullMQ producer.
 */
export interface ProducerConfig<T = any> {
  queueName: string;
  connection?: any;
  defaultJobOptions?: JobsOptions;
  serializer?: BrokerSerializer<T>;
  retry?: { attempts?: number; backoffMs?: number; maxMs?: number };
}

/**
 * Configuration options for a BullMQ message.
 */
export interface BrokerMessage<T = any> {
  topic: string;
  payload: T;
  headers?: any;
  timestamp: number;
  id?: string;
}

/**
 * Configuration options for a BullMQ consumer.
 */
export interface ConsumerConfig<T = any> {
  queueName: string;
  connection?: any;
  concurrency?: number;
  processor: (job: {
    id: string;
    data: T;
    attemptsMade: number;
    timestamp: number;
  }) => Promise<void> | void;
  serializer?: BrokerSerializer<T>;
}

/**
 * Configuration options for a BullMQ broker.
 */
export interface Broker {
  publish<T>(topic: string, message: T, options?: any): Promise<void>;
  subscribe<T>(
    topic: string,
    handler: (msg: BrokerMessage<T>) => Promise<void> | void,
    options?: any
  ): Promise<void>;
  unsubscribe<T>(
    topic: string,
    handler: (msg: BrokerMessage<T>) => Promise<void> | void
  ): Promise<void>;
}

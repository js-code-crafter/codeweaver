import amqplib, { Connection, Channel } from "amqplib";

/**
 * Manages a RabbitMQ channel and connection.
 */
export class ChannelManager {
  private connection?: Connection;
  private channel?: Channel;

  /**
   * Creates a new ChannelManager.
   * @param opts - Connection options.
   * @param opts.url - The URL of the RabbitMQ server.
   */
  public constructor(private opts: { url: string }) {}

  /**
   * Establishes a connection to the RabbitMQ server and creates a new channel.
   * If a connection has already been established, this method returns immediately.
   * @returns A promise resolved when the connection has been established.
   */
  public async connect(): Promise<void> {
    if (this.connection) return;
    this.connection = await amqplib.connect(this.opts.url);
    this.channel = await this.connection.createChannel();
  }

  /**
   * Returns the underlying Channel object.
   * Throws if connect() has not been called first.
   * @returns The underlying Channel object.
   */
  public get ch(): Channel {
    if (!this.channel)
      throw new Error("Channel not initialized. Call connect() first.");
    return this.channel;
  }

  /**
   * Closes the underlying Channel and Connection objects.
   * If the Channel or Connection objects do not exist, this method does nothing.
   * @returns A promise resolved when the Channel and Connection objects have been closed.
   */
  public async close(): Promise<void> {
    await this.channel?.close?.();
    await this.connection?.close?.();
    this.channel = undefined;
    this.connection = undefined;
  }

  /**
   * Asserts the existence of a queue on the RabbitMQ server.
   * @param queue - The name of the queue to assert.
   * @param durable - Optional flag indicating whether the queue should be durable.
   * @returns A promise resolved when the queue has been asserted.
   * @throws If the queue does not exist or if the durable flag does not match the queue's durable status.
   */
  public async assertQueue(
    queue: string,
    durable: boolean = true
  ): Promise<void> {
    await this.ch.assertQueue(queue, { durable });
  }

  /**
   * Asserts the existence of an exchange on the RabbitMQ server.
   * @param name - The name of the exchange to assert.
   * @param type - The type of the exchange to assert.
   * @param durable - Optional flag indicating whether the exchange should be durable.
   * @returns A promise resolved when the exchange has been asserted.
   * @throws If the exchange does not exist or if the durable flag does not match the exchange's durable status.
   */
  public async assertExchange(
    name: string,
    type: string,
    durable: boolean = true
  ): Promise<void> {
    await this.ch.assertExchange(name, type, { durable });
  }

  /**
   * Binds a queue to an exchange with an optional routing key.
   * @param queue - The name of the queue to bind.
   * @param exchange - The name of the exchange to bind to.
   * @param routingKey - Optional routing key to use when binding the queue to the exchange.
   * @returns A promise resolved when the queue has been bound to the exchange.
   */
  public async bindQueue(
    queue: string,
    exchange: string,
    routingKey: string = ""
  ): Promise<void> {
    await this.ch.bindQueue(queue, exchange, routingKey);
  }
}

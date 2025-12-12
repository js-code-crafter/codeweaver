/**
 * Compute the next delay in milliseconds according to an exponential backoff
 * algorithm with jitter.
 *
 * @param attempt The attempt number, starting from 1.
 * @param baseMs The base delay in milliseconds, defaults to 100.
 * @param maxMs The maximum delay in milliseconds, defaults to 3000.
 * @returns The computed delay in milliseconds.
 */
export function backoff(attempt: number, baseMs = 100, maxMs = 3000): number {
  const cap = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  // jitter
  return cap / 2 + Math.floor(Math.random() * (cap / 2));
}

/**
 * Validates a topic name.
 * @param name The topic name to validate.
 * @throws {Error} If the topic name is invalid (null, undefined, not a string) or too long (> 249 characters).
 */
export function validateTopic(name: string): void {
  if (!name || typeof name !== "string") throw new Error("Invalid topic name");
  // simple rule demo; adapt to your needs
  if (name.length > 249) throw new Error("Topic name too long");
}

/**
 * Interface for serializing and deserializing data for a message broker.
 * @template T The type of data to serialize and deserialize.
 */
export interface BrokerSerializer<T = any> {
  version?: number;
  serialize?: (data: T) => Buffer;
  deserialize?: (buffer: Buffer) => T;
}

/**
 * Returns a default broker serializer for JSON-serialized data.
 * The serializer will store the given version number in the serialized data.
 * The deserializer will parse the JSON data and return the deserialized object.
 * @param version The version number to store in the serialized data.
 * @returns A default broker serializer for JSON-serialized data.
 */
export function getDefaultJsonSchema<T>(version?: number): BrokerSerializer<T> {
  return {
    version,
    serialize: (data: T): Buffer => Buffer.from(JSON.stringify(data)),
    deserialize: (buffer: Buffer): T => JSON.parse(buffer.toString()) as T,
  };
}

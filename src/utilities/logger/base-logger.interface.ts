// src/logging/BaseLogger.ts

/**
 * The supported log levels for the logger.
 * - fatal: an unrecoverable error that will terminate the process
 * - error: a recoverable error that should be reported
 * - warn: unexpected situation that is not an error
 * - info: general operational information
 * - debug: detailed information useful for debugging
 * - trace: highly verbose information for tracing execution
 */
export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

/**
 * Arbitrary metadata attached to log entries.
 * Keys are strings and values can be any serializable data.
 */
export interface Meta {
  [key: string]: unknown;
}

/**
 * A minimal base logger interface that defines a single logging method.
 * Implementations should route messages to the appropriate output (console, file, etc.)
 * according to the provided log level, message, and optional metadata.
 */
export interface BaseLogger {
  /**
   * Log a message at the specified log level, with optional metadata.
   *
   * @param level - The severity of the log message. One of: "fatal", "error", "warn", "info", "debug", "trace".
   * @param message - The human-readable log message to record.
   * @param meta - Optional additional structured data to accompany the log entry.
   */
  log(level: LogLevel, message: string, meta?: Meta): void;
}

import { BaseLogger, LogLevel, Meta } from "./base-logger.interface";

/**
 * LoggerService is a custom logger service that integrates Winston for advanced logging capabilities.
 */
export class LoggerService {
  /**
   * Constructs a new LoggerService instance.
   *
   * @param logger - Injected logger instance
   */
  public constructor(private logger: BaseLogger) {}

  /**
   * Logs an informational message with optional context and metadata.
   * This method combines the provided metadata with the context and log level,
   * and sends the log entry to the appropriate transports.
   *
   * @param message - The message to log
   * @param context - Optional context information (e.g., module or method name)
   * @param meta - Additional metadata to include in the log entry
   */
  public log(level: LogLevel, message: string, meta: Meta = {}): void {
    meta.timestamp = new Date().toISOString();
    this.logger.log(level, message, meta);
  }

  /**
   * Logs an informational message with optional context and metadata.
   * This method combines the provided metadata with the context and log level,
   * and sends the log entry to the appropriate transports.
   *
   * @param message - The message to log
   * @param context - Optional context information (e.g., module or method name)
   * @param meta - Additional metadata to include in the log entry
   */
  public info(message: string, context?: string, meta: Meta = {}): void {
    this.log("info", message, { context, ...meta });
  }

  /**
   * Logs a fatal error message with optional trace, context, and metadata.
   * This method combines the provided metadata with the trace and context,
   * and sends the log entry to the appropriate transports.
   *
   * @param message - The fatal error message to log
   * @param trace - Optional trace information for the error
   * @param context - Optional context information (e.g., module or method name)
   * @param meta - Additional metadata to include in the log entry
   */
  public fatal(
    message: string,
    context?: string,
    trace?: string,
    meta: Meta = {}
  ): void {
    this.log("fatal", message, { context, trace, ...meta });
  }

  /**
   * Logs an error message with optional trace, context, and metadata.
   * This method combines the provided metadata with the trace and context,
   * and sends the log entry to the appropriate transports.
   *
   * @param message - The error message to log
   * @param trace - Optional trace information for the error
   * @param context - Optional context information (e.g., module or method name)
   * @param meta - Additional metadata to include in the log entry
   */
  public error(
    message: string,
    context?: string,
    trace?: string,
    meta: Meta = {}
  ): void {
    this.log("error", message, { context, trace, ...meta });
  }

  /**
   * Logs a warning message with optional context and metadata.
   * This method combines the provided metadata with the context and log level,
   * and sends the log entry to the appropriate transports.
   *
   * @param message - The warning message to log
   * @param context - Optional context information (e.g., module or method name)
   * @param meta - Additional metadata to include in the log entry
   */
  public warn(
    message: string,
    context?: string,
    trace?: string,
    ...meta: unknown[]
  ): void {
    this.log("warn", message, { context, trace, ...meta });
  }

  /**
   * Logs a debug message with optional context and metadata.
   * This method combines the provided metadata with the context and log level,
   * and sends the log entry to the appropriate transports.
   *
   * @param message - The debug message to log
   * @param context - Optional context information (e.g., module or method name)
   * @param meta - Additional metadata to include in the log entry
   */
  public debug(message: string, context?: string, ...meta: unknown[]): void {
    this.log("debug", message, { context, ...meta });
  }

  /**
   * Logs a trace message with optional context and metadata.
   * This method combines the provided metadata with the context and log level,
   * and sends the log entry to the appropriate transports.
   *
   * @param message - The trace message to log
   * @param context - Optional context information (e.g., module or method name)
   * @param meta - Additional metadata to include in the log entry
   */
  public trace(message: string, context?: string, ...meta: unknown[]): void {
    this.log("trace", message, { context, ...meta });
  }
}

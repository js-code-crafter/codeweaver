// src/logging/BaseLogger.ts

export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";

export interface Meta {
  [key: string]: unknown;
}

export interface BaseLogger {
  log(level: LogLevel, message: string, meta?: Meta): void;
}

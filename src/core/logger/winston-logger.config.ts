import * as winston from "winston";
import { TransformableInfo } from "logform";
import "winston-daily-rotate-file"; // Import the DailyRotateFile transport to extend winston transports

// Console format: colorized and pretty printed
// Custom formatting to include timestamp, context, level, and message
//
// Example: "2023-10-05T12:00:00.000Z [MyContext] info: This is a log message"
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp(),
  winston.format.printf(
    ({
      timestamp,
      level,
      message,
      context,
      ...meta
    }: TransformableInfo): string => {
      const contextStr = context ? `[${context as string}]` : "[main]";

      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";

      return `${timestamp as string} ${contextStr} ${level}: ${
        message as string
      } ${metaStr}`;
    }
  )
);

// File format: JSON with timestamp
// This format is suitable for structured logging and easier parsing by
// log management systems
//
// Example: {"timestamp":"2023-10-05T12:00:00.000Z", "level":"info",
// "message":"This is a log message", "context":"MyContext"}
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Console transport for logging to the console with colorized output
// and custom formatting that includes timestamp, context, level, and message.
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
});

// File transport for logging to files with daily rotation.
// It logs everything at the trace level and formats logs as JSON.
// The logs are stored in the "logs" directory with a date pattern
// in the filename.
// The logs are zipped and rotated daily, keeping logs for 14 days.
const fileTransport = new winston.transports.DailyRotateFile({
  dirname: "logs",
  filename: "app-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
  level: "trace", // log everything to file / external service
  format: fileFormat,
});

// Add custom colors for log levels to enhance console output readability
// This allows log levels to be displayed in different colors in the console.
// Define a custom logger with explicit levels
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  },
  colors: {
    fatal: "red bold",
    error: "red",
    warn: "yellow",
    info: "green",
    debug: "blue",
    trace: "grey",
  },
};

winston.addColors(customLevels.colors);

export const winstonLogger = winston.createLogger({
  levels: customLevels.levels,
  level: "trace",
  transports: [consoleTransport, fileTransport],
  exitOnError: false,
  exceptionHandlers: [consoleTransport, fileTransport],
  rejectionHandlers: [consoleTransport, fileTransport],
});

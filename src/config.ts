import {
  memoizeTime,
  productionEnvironment,
  rateLimitTimeSpan,
  rateLimitAllowedCalls,
  timeout,
  port,
  cacheSize,
  http,
} from "./constants";
import { SwaggerOptions } from "./swagger-options";
import { stringToBoolean } from "./utilities/conversion";
import { logger } from "./utilities/logger/logger.config";

/**
 * Main application configuration
 * @interface
 * @property {boolean} devMode - Development mode flag
 * @property {string} port - Server port
 * @property {SwaggerOptions} swaggerOptions - Swagger configuration
 */
interface Config {
  devMode: boolean;
  http: string;
  port: number;
  swagger: boolean;
  swaggerOptions: SwaggerOptions;
  timeout: number;
  rateLimitTimeSpan: number;
  rateLimitAllowedCalls: number;
  memoizeTime: number;
  cacheSize: number;
}

export const config: Config = {
  devMode: process.env.NODE_ENV !== productionEnvironment,
  http: process.env.HTTP || http,
  port: Number(process.env.PORT) || port,
  swagger: stringToBoolean(process.env.SWAGGER || "true"),
  swaggerOptions: {
    swaggerDefinition: {
      openApi: "3.0.0",
      info: {
        title: "Express Items API",
        version: "1.0.0",
        description: "A simple CRUD API with Swagger documentation",
      },
      servers: [
        {
          url: "http://localhost:" + port,
        },
      ],
    },
    apis: [
      "./src/routers/index.router.ts",
      "./src/routers/**/*.router.ts",
      "./src/routers/index.router.js",
      "./src/routers/**/*.router.js",
    ], // Path to the API docs
  },
  timeout: Number(process.env.TIMEOUT) || timeout,
  rateLimitTimeSpan:
    Number(process.env.RATE_LIMIT_TIME_SPAN) || rateLimitTimeSpan,
  rateLimitAllowedCalls:
    Number(process.env.RATE_LIMIT_ALLOWED_CALLS) || rateLimitAllowedCalls,
  memoizeTime: Number(process.env.MEMOIZE_TIME) || memoizeTime,
  cacheSize: Number(process.env.CACHE_SIZE) || cacheSize,
};

export const container = { logger };

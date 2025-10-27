import {
  memoizeTime,
  productionEnvironment,
  rateLimitTimeSpan,
  rateLimitAllowedCalls,
  timeout,
  portNumber,
  cacheSize,
} from "./constants";
import { SwaggerOptions } from "./swagger-options";
import { stringToBoolean } from "./utilities/conversion";

/**
 * Main application configuration
 * @interface
 * @property {boolean} devMode - Development mode flag
 * @property {string} port - Server port
 * @property {SwaggerOptions} swaggerOptions - Swagger configuration
 */
interface Config {
  devMode: boolean;
  port: number;
  swagger: boolean;
  swaggerOptions: SwaggerOptions;
  timeout: number;
  rateLimitTimeSpan: number;
  rateLimitAllowedCalls: number;
  memoizeTime: number;
  cacheSize: number;
}

const port = Number(process.env.PORT) || portNumber;

let config: Config = {
  devMode: process.env.NODE_ENV !== productionEnvironment,
  port,
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
  rateLimitTimeSpan: Number(process.env.RATE_LIMIT) || rateLimitTimeSpan,
  rateLimitAllowedCalls:
    Number(process.env.RATE_LIMIT) || rateLimitAllowedCalls,
  memoizeTime: Number(process.env.MEMOIZE_TIME) || memoizeTime,
  cacheSize: Number(process.env.CACHE_SIZE) || cacheSize,
};

export default config;

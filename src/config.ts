import {
  memoizeTime,
  productionEnvironment,
  rateLimitTimeSpan,
  rateLimitAllowedCalls,
  timeout,
  portNumber,
} from "./constants";

/**
 * Server configuration interface
 * @interface
 * @property {string} url - Base server URL
 */
interface Server {
  url: string;
}

/**
 * API information structure
 * @interface
 * @property {string} title - API title
 * @property {string} version - API version
 * @property {string} description - API description
 */
interface Info {
  title: string;
  version: string;
  description: string;
}

/**
 * Swagger definition structure
 * @interface
 * @property {string} openApi - OpenAPI specification version
 * @property {Info} info - API information
 * @property {Server[]} servers - List of server configurations
 */
interface SwaggerDefinition {
  openApi: string;
  info: Info;
  servers: Server[];
}

/**
 * Swagger configuration options
 * @interface
 * @property {SwaggerDefinition} swaggerDefinition - Swagger definition object
 * @property {string[]} apis - Paths to API documentation files
 */
interface SwaggerOptions {
  swaggerDefinition: SwaggerDefinition;
  apis: string[];
}

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
  swaggerOptions: SwaggerOptions;
  timeout: number;
  rateLimitTimeSpan: number;
  rateLimitAllowedCalls: number;
  memoizeTime: number;
}

const port = Number(process.env.PORT) || portNumber;

let config: Config = {
  devMode: process.env.NODE_ENV !== productionEnvironment,
  port,
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
      "./src/routers/index.ts",
      "./src/routers/**/*.ts",
      "./src/routers/index.js",
      "./src/routers/**/*.js",
    ], // Path to the API docs
  },
  timeout: Number(process.env.TIMEOUT) || timeout,
  rateLimitTimeSpan: Number(process.env.RATE_LIMIT) || rateLimitTimeSpan,
  rateLimitAllowedCalls:
    Number(process.env.RATE_LIMIT) || rateLimitAllowedCalls,
  memoizeTime: Number(process.env.MEMOIZE_TIME) || memoizeTime,
};

export default config;

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
export interface SwaggerOptions {
  swaggerDefinition: SwaggerDefinition;
  apis: string[];
}

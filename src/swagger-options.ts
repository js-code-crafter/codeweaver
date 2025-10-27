/**
 * Server configuration interface
 */
interface Server {
  /** URL of the base server */
  url: string;
}

/**
 * API information structure
 */
interface Info {
  /** Title of the API */
  title: string;
  /** Version of the API */
  version: string;
  /** Description of the API */
  description: string;
}

/**
 * Swagger definition structure
 */
interface SwaggerDefinition {
  /** OpenAPI specification version (e.g., "3.0.0") */
  openApi: string;
  /** API information object */
  info: Info;
  /** List of server configurations */
  servers: Server[];
}

/**
 * Swagger configuration options
 */
export interface SwaggerOptions {
  swaggerDefinition: SwaggerDefinition;
  apis: string[];
}

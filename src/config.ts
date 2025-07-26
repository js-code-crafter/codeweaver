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
  port: string;
  swaggerOptions: SwaggerOptions;
}

const port = process.env.PORT || "3000";
const config: Config = {
  devMode: process.env.NODE_ENV !== "production",
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
};

// Other configurations:
//
// config.jwt_key = config.devMode ? "" : "";
// config.jwt_expiration = config.devMode ? 360000 : 360000;
// config.dbConnectionString = config.devMode ? `mongoDb url` : `mongoDb url`;
// config.mongoDebug = config.devMode;
// config.port = config.devMode ? 3000 : 3000;
// config.host = config.devMode ? "localhost" : "localhost";
// config.env = config.devMode ? "development" : "production";
// config.mongoUrl = config.devMode ? "mongodb://localhost:27017/test" : "mongodb://localhost:27017/test";

export default config;

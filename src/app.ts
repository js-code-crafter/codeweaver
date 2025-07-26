import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import fs from "fs";
import path from "path";
import config from "./config";

/**
 * Recursively loads Express routers from directory
 * @param {string} routerPath - Directory path to scan
 * @param {string} [basePath=""] - Base route path
 */
function loadRouters(routerPath: string, basePath: string = "") {
  fs.readdirSync(routerPath).forEach((file) => {
    // Check if the filename should be excluded based on certain criteria
    if (
      // Exclude files that start with an underscore (_)
      file.startsWith("_") ||
      // Exclude files that start with an at symbol (@)
      file.startsWith("@") ||
      // Exclude JavaScript controller files
      file.endsWith(".controller.js") ||
      // Exclude TypeScript controller files
      file.endsWith(".controller.ts") ||
      // Exclude JavaScript service files
      file.endsWith(".service.js") ||
      // Exclude TypeScript service files
      file.endsWith(".service.ts") ||
      // Exclude JavaScript middleware files
      file.endsWith(".middleware.js") ||
      // Exclude TypeScript middleware files
      file.endsWith(".middleware.ts") ||
      // Exclude JavaScript error middleware files
      file.endsWith(".error.js") ||
      // Exclude TypeScript error middleware files
      file.endsWith(".error.ts") ||
      // Exclude JavaScript service files
      file.endsWith(".decorator.js") ||
      // Exclude TypeScript service files
      file.endsWith(".decorator.ts") ||
      // Exclude JavaScript DTO files
      file.endsWith(".dto.js") ||
      // Exclude TypeScript DTO files
      file.endsWith(".dto.ts") ||
      // Exclude JavaScript test specification files
      file.endsWith(".spec.js") ||
      // Exclude TypeScript test specification files
      file.endsWith(".spec.ts")
    )
      // If any of the above conditions are true, exit the function early
      return;

    const fullPath = path.join(routerPath, file);

    // Construct a route path by combining the base path with the filename
    const routePath = path
      // Join the base path and the filename, removing the file extension (.js or .ts)
      .join(basePath, file.replace(/(\.js|\.ts)/g, ""))
      // Replace all backslashes with forward slashes for consistent file path formatting
      .replaceAll("\\", "/")
      // Remove the trailing '/index' if it exists, to clean up the route
      .replace(/\/?index$/g, "");

    if (fs.lstatSync(fullPath).isDirectory()) {
      // If the file is a directory, call the function again
      loadRouters(fullPath, routePath);
    } else if (file.endsWith(".ts") || file.endsWith(".js")) {
      // Import the router module and mount it to the app
      const router = require(fullPath);
      app.use("/" + routePath, router);
      console.log(`Mounted ${file} at ${"/" + routePath}`);
    }
  });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//app.use(cors());

// Automatically import all routers from the /src/routers directory
const routersPath = path.join(__dirname, "/routers");
loadRouters(routersPath);

// Swagger setup
if (config.devMode) {
  const swaggerJsDoc = require("swagger-jsdoc");
  const swaggerUi = require("swagger-ui-express");
  const swaggerDocs = swaggerJsDoc(config.swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

// General error handler
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json(err);
});

// Start the server
app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
  if (config.devMode)
    console.log(
      `Swagger UI is available at http://localhost:${config.port}/api-docs`
    );
});

import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { config } from "./config";
import { ResponseError } from "./utilities/error-handling";
import { resolve } from "./utilities/container";
import { WinstonLoggerService } from "./utilities/logger/winston-logger.service";
import "dotenv/config";
import {
  defaultRouter,
  routerDir,
  routerExtension,
  swaggerPath,
} from "./constants";
//import cors from "cors";

/**
 * Recursively loads Express routers from directory
 * @param {string} routerPath - Directory path to scan
 * @param {string} [basePath=""] - Base route path
 */
function loadRouters(routerPath: string, basePath: string = "") {
  // Read entries with their type info
  const entries = fs.readdirSync(routerPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(routerPath, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectories
      const subRoutePath = path
        .join(basePath, entry.name)
        .replace(/\\/g, "/")
        .replace(/\/?index$/g, "");
      loadRouters(fullPath, subRoutePath);
      continue;
    }

    // Only handle router files
    if (
      !entry.name.endsWith(`${routerExtension}.ts`) &&
      !entry.name.endsWith(`${routerExtension}.js`)
    ) {
      continue;
    }

    // Build route path safely
    const routePath = path
      .join(
        basePath,
        entry.name.replace(new RegExp(`\\${routerExtension}\\.([tj]s)$`), "")
      )
      .replace(/\\/g, "/")
      .replace(new RegExp(`\\/?${defaultRouter}$`), "");

    // Optional: skip if the target path would be empty (maps to /)
    const mountPath = "/" + (routePath || "");

    // Import and mount
    const router = require(fullPath);
    app.use(mountPath, router);
    console.log(`Mounted ${entry.name} at ${mountPath}`);
  }
}

const app = express();
//app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Automatically import all routers from the /src/routers directory
const routersPath = path.join(__dirname, routerDir);
loadRouters(routersPath);

// Swagger setup
if (config.swagger) {
  const swaggerJsDoc = require("swagger-jsdoc");
  const swaggerUi = require("swagger-ui-express");
  const swaggerDocs = swaggerJsDoc(config.swaggerOptions);
  app.use(swaggerPath, swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

// General error handler
app.use(
  (error: ResponseError, req: Request, res: Response, next: NextFunction) => {
    const logger = resolve(WinstonLoggerService);
    const status = error.status ?? 500;
    const errorObject = {
      status,
      code: error.code,
      input: error.input,
      stack: error.stack,
      cause: error.cause,
    };

    res.status(status).json(error);
    if (status < 500) {
      logger.warn(error.message, "Invalid request", error.details, errorObject);
    } else {
      if (status == 401 || status == 403) {
        logger.fatal(error.message, "Forbidden", error.details, errorObject);
      } else {
        logger.error(error.message, "Server error", error.details, errorObject);
      }
    }
  }
);

// Start the server
app.listen(config.port, () => {
  console.log(`Server is running on ${config.http}:${config.port}`);
  if (config.devMode) {
    console.log(
      `Swagger UI is available at ${config.http}:${config.port}${swaggerPath}`
    );
  }
});

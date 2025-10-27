import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import config from "./config";
import { ResponseError } from "./utilities/error-handling";
require("./app");

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
      !entry.name.endsWith(".router.ts") &&
      !entry.name.endsWith(".router.js")
    ) {
      continue;
    }

    // Build route path safely
    const routePath = path
      .join(basePath, entry.name.replace(/\.router\.[tj]s$/, ""))
      .replace(/\\/g, "/")
      .replace(/\/?index$/g, "");

    // Optional: skip if the target path would be empty (maps to /)
    const mountPath = "/" + (routePath || "");

    // Import and mount
    const router = require(fullPath);
    app.use(mountPath, router);
    console.log(`Mounted ${entry.name} at ${mountPath}`);
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Automatically import all routers from the /src/routers directory
const routersPath = path.join(__dirname, "/routers");
loadRouters(routersPath);

// Swagger setup
if (config.swagger) {
  const swaggerJsDoc = require("swagger-jsdoc");
  const swaggerUi = require("swagger-ui-express");
  const swaggerDocs = swaggerJsDoc(config.swaggerOptions);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
}

// General error handler
app.use(
  (err: ResponseError, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status ?? 500).json(err);
  }
);

// Start the server
app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
  if (config.devMode) {
    console.log(
      `Swagger UI is available at http://localhost:${config.port}/api-docs`
    );
  }
});

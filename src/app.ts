import express from "express";
import fs from "fs";
import path from "path";
import config from "./config";

// Function to load routers recursively
function loadRouters(routerPath: string, basePath: string = "") {
  fs.readdirSync(routerPath).forEach((file) => {
    const fullPath = path.join(routerPath, file);
    const routePath = path
      .join(basePath, file.replace(/(\.js|\.ts)/g, ""))
      .replaceAll("\\", "/")
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

// Start the server
app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
  if (config.devMode)
    console.log(
      `Swagger UI is available at http://localhost:${config.port}/api-docs`
    );
});

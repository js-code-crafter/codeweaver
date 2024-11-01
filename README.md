# Your Express TypeScript API with Swagger Integration

## Overview

This project is a RESTful API built with **Express** and **TypeScript** that integrates **Swagger** for API documentation. The application employs **async handlers** for better error management and uses a modular structure for routers, allowing for easy expansion and organization of the application.

## Features

- **Express Framework**: A lightweight web application framework for building web applications in Node.js.
- **TypeScript**: Provides strong typing for better development experience and less runtime errors.
- **Swagger Integration**: Automatically generates interactive API documentation, making it easy for developers and consumers to understand the available endpoints.
- **Async Handlers**: Supports async/await syntax for writing cleaner and more maintainable asynchronous code without deeply nested callbacks.
- **Modular Router Structure**: Each router is automatically imported and mounted, providing clean separation of endpoints and logic.

## Technologies Used

- Node.js
- Express
- TypeScript
- Zod (for input validation)
- ts-zod-decorators (for validation using Zod with decorators)
- utils-decorators (for middleware utilities like throttling and error handling)
- Swagger (for API documentation)

## Installation

To get started with the project, follow these steps:

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-repo/your-project.git
   cd your-project
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Build the TypeScript files** (if necessary):

   ```bash
   npm run build
   ```

4. **Run the application**:

   ```bash
   npm start
   ```

5. **Visit the Swagger UI**: Open your browser and go to `http://localhost:3000/api-docs` to view the automatically generated API documentation.

## Sample Project Structure

/src
├── /routers # Directory containing all router files
│ ├── /user # Routers for user-related endpoints
│ │ ├── index.ts
│ │ ├── user_router1.ts
│ │ ├── user_router2.ts
│ │ ├── user.controller.ts
│ │ ├── user.service.ts
│ │ ├── user.dto.ts
│ ├── /product # Router for product-related endpoints
│ │ ├── index.ts
│ │ ├── product.spec.ts
│ │ ├── product.controller.ts
│ │ ├── product.service.ts
│ │ ├── dto
│ │ │ ├── product.dto.ts
│ | ├── /order # Router for order-related endpoints
│ │ | ├── index.ts
│ │ | ├── order_test.spec.ts
│ │ | ├── order.controller.ts
│ │ | ├── order.service.ts
│ └── index.ts # Home page
├── app.ts # Main application file
├── config.ts # Application configuration file
└── ... # Other files (middleware, models, etc.)

### Router Directory

Each router file in the `/routers` directory is organized to handle related endpoints. The `index.ts` file in the router directory automatically imports all routers and mounts them to the main Express application, making it simple to add new routes without modifying central files.

Example of a basic router:

```typescript
import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get the home page
 *     description: Returns the home page.
 *     responses:
 *       200:
 *         description: home page
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.send("Home");
  })
);

export = router;
```

### Async Handlers

To maintain cleaner code and improve error handling, the app suggests the `express-async-handler` package that automatically catches exceptions inside of async express routes and passing them to the express error handlers. This allows you to focus on writing the business logic without worrying about try/catch blocks.

### API Documentation

Once the application is running, visit the Swagger UI at http://localhost:3000/api-docs. This automatically generated documentation will provide you with all available routes along with details on request parameters, response structures, and possible error codes.

### Decorators

To prevent abuse of your API, you can utilize throttling, and validation decorators from the `utils-decorators` and `ts-zod-decorators` packages respectively. This packages provides decorators that can be applied directly to your service and controller classes.

### Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to create an issue or submit a pull request.

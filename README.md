# A lightweight framework built on top of Express and TypeScript

## Overview

**Codeweaver** is a lightweight microframework built on top of `Express` and `TypeScript`, integrating `Swagger` for API documentation. The application utilizes `async handlers` for improved error management and follows a modular structure for routers, enabling easy expansion and organization of the application.

## Features

- **Modular Router Structure**: Each router is automatically imported and mounted, providing clean separation of endpoints and logic.
- **Express Framework**: A lightweight web application framework for building web applications in Node.js.
- **TypeScript**: Provides strong typing for better development experience and less runtime errors.
- **Swagger Integration**: Automatically generates interactive API documentation, making it easy for developers and consumers to understand the available endpoints.
- **Async Handlers**: Supports async/await syntax for writing cleaner and more maintainable asynchronous code without deeply nested callbacks.

## Technologies Used

- **Node.js**
- **Express**
- **TypeScript**
- **Zod** (for input validation)
- **ts-zod-decorators** (for validation using Zod with decorators)
- **utils-decorators** (for middleware utilities like throttling and error handling)
- **Swagger** (for API documentation)

## Installation

To get started with the project, follow these steps:

1. **Clone the repository**:

   ```bash
   npm install -g codeweaver
   npx create-codeweaver-app my-app
   cd my-app
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the application**:

   ```bash
   npm start
   ```

4. **Visit the Swagger UI**: Open your browser and go to `http://localhost:3000/api-docs` to view the automatically generated API documentation.

5. **Build**: Compile the TypeScript files for the production environment:

   ```bash
   npm run build
   ```

## Sample Project Structure

**/src**  
├── **/routers** `Directory containing all router files`  
│ ├── **/user** `Routers for user-related endpoints`  
│ │ ├── user_router1.ts `/user/user_router1`  
│ │ ├── user_router2.ts `/user/user_router2`  
│ │ ├── user.controller.ts  
│ │ ├── user.service.ts  
│ │ └── user.dto.ts  
│ ├── **/product** `Routers for product-related endpoints`  
│ │ ├── index.ts `/product`  
│ │ ├── product_test.spec.ts  
│ │ ├── product.controller.ts  
│ │ ├── product.service.ts  
│ │ ├── **/dto**  
│ │ │ └── product.dto.ts  
│ ├── **/order** `Routers for order-related endpoints`  
│ │ ├── index.ts `/order`  
│ │ ├── order_test.spec.ts  
│ │ ├── order.controller.ts  
│ │ └── order.service.ts  
│ └── index.ts `Home page`  
├── app.ts `Main application file`  
├── config.ts `Application configuration file`  
└── ... `Other files (middleware, models, etc.)`

### Router Directory

Each router file in the `/routers` directory is organized to handle related endpoints. The `app.ts` file automatically imports all routers and mounts them to the main Express application, making it simple to add new routes without modifying central files.

Files that end with `.controller`, `.service`, `.spec`, `.dto`, `.middleware`, `.error`, or `.decorator`, as well as those that start with `_` or `@`, are excluded from the router list and can be utilized for various other purposes within the application.

Example of a basic router:

```typescript
import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import UserController from "./user.controller";
import { sendError } from "../../utilities";

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a user
 *     description: Create a new user.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: user
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - username
 *             - email
 *             - password
 *           properties:
 *             username:
 *               type: string
 *               minLength: 3
 *               example: JessicaSmith
 *             email:
 *               type: string
 *               format: email
 *               example: user@example.com
 *             password:
 *               type: string
 *               minLength: 6
 *               example: securePassword123
 *     responses:
 *       201:
 *         description: User created
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userController.create(req.body);
    res.status(201).json(user);
  })
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get an user by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: An user object
 *       404:
 *         description: user not found
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const user = await userController.get(req.params.id);

    if ("id" in user == false) sendError(res, user);
    else res.status(200).json(user);
  })
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get users
 *     description: Returns a list of user objects.
 *     responses:
 *       200:
 *         description: A list of user objects
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await userController.getAll());
  })
);

export = router;
```

### Controllers

**Controllers** in this Express TypeScript framework act as the intermediary between the incoming HTTP requests and the application logic. Each controller is responsible for handling specific routes and defining the behavior associated with those routes. This organization promotes a clean architecture by separating business logic, validation, and routing concerns.

Controllers can be organized within the router folders, allowing them to stay closely related to their respective routes. However, they are not limited to this structure and can be placed anywhere within the `src` folder as needed, providing flexibility in organizing the codebase.

Controllers leverage decorators from the `ts-zod-decorators` package to implement input validation and error handling gracefully. With validators like `@Validate`, controllers can ensure that incoming data adheres to defined schemas before any processing occurs, preventing invalid data from reaching the service layer. This capability enhances data integrity and application reliability.

For example, in the provided `UserController`, the `createUser` method demonstrates how to apply input validation and error handling through decorators. It employs `@rateLimit` to restrict the number of allowed requests within a specified timeframe, effectively guarding against too many rapid submissions. When an error arises, the `@onError` decorator provides a systematic way to handle exceptions, allowing for logging or other error management processes to be performed centrally.

Here’s a brief breakdown of key components used in the `UserController`:

- **Validation**: The `CreateUserDto` is validated against incoming data using the `@ZodInput` decorator, ensuring that only well-formed data is passed to the business logic, which is crucial for maintaining application stability.

```typescript
import { z } from "zod";

/**
 * Zod schema for User entity
 * @typedef {Object} ZodUser
 * @property {number} id - Unique identifier (min 1)
 * @property {string} username - Username (min 3 chars)
 * @property {string} email - Valid email format
 * @property {string} password - Password (min 6 chars)
 */
export const ZodUser = z.object({
  id: z.number().min(1).int(),
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

export const ZodUserCreationDto = ZodUser.omit({ id: true });

export type User = z.infer<typeof ZodUser>;
export type UserCreationDto = z.infer<typeof ZodUserCreationDto>;
```

- **Throttling and Rate Limiting**: The `@rateLimit` decorator is applied to safeguard the application's endpoints from abuse by limiting how frequently a particular method can be invoked.

- **Error Handling**: The `@onError` decorator captures any exceptions that occur during the execution of the createUser method, allowing for centralized error management, which can greatly simplify debugging and improve maintainability.

By using a well-organized controller structure, this project makes it easier to add, modify, and manage endpoints as the application grows. Developers can focus on implementing business logic while the controllers handle the intricacies of request parsing, validation, and response formatting. Additionally, this separation of concerns improves unit testing, as controllers can be tested independently from the rest of the application logic, ensuring robust and reliable API behavior.

Here is a quick reference to the UserController in practice:

```typescript
import { Validate, ZodInput } from "ts-zod-decorators";
import { User, ZodUserCreationDto, UserCreationDto } from "./dto/user.dto";
import { onError, rateLimit, timeout } from "utils-decorators";
import { ResponseError } from "../../types";
import { tryParseId } from "../../utilities";

// Array to store users (as a mock database)
const users = [
  {
    id: 1,
    username: "johndoe",
    email: "johndoe@gmail.com",
    password: "S3cur3P@ssw0rd",
  },
  {
    id: 2,
    username: "janesmith",
    email: "janesmith@yahoo.com",
    password: "P@ssw0rd2024",
  },
  {
    id: 3,
    username: "michael89",
    email: "michael89@hotmail.com",
    password: "M1chael!2024",
  },
  {
    id: 4,
    username: "lisa.wong",
    email: "lisa.wong@example.com",
    password: "L1saW0ng!2024",
  },
  {
    id: 5,
    username: "alex_k",
    email: "alex.k@gmail.com",
    password: "A1ex#Key2024",
  },
  {
    id: 6,
    username: "emilyj",
    email: "emilyj@hotmail.com",
    password: "Em!ly0101",
  },
  {
    id: 7,
    username: "davidparker",
    email: "david.parker@yahoo.com",
    password: "D@v!d2024",
  },
  {
    id: 8,
    username: "sophia_m",
    email: "sophia.m@gmail.com",
    password: "Sophi@2024",
  },
  {
    id: 9,
    username: "chrisw",
    email: "chrisw@outlook.com",
    password: "Chri$Wong21",
  },
  {
    id: 10,
    username: "natalie_b",
    email: "natalie_b@gmail.com",
    password: "N@talie#B2024",
  },
];

function exceedHandler() {
  const message = "Too much call in allowed window";

  throw new Error(message, {
    cause: { status: 500, message } satisfies ResponseError,
  });
}

function getUserErrorHandler(e: Error) {
  const message = "User not found.";

  throw new Error(message, {
    cause: { status: 404, message, details: e.message } satisfies ResponseError,
  });
}

/**
 * Controller for handling user-related operations
 * @class UserController
 * @desc Provides methods for user management including CRUD operations
 */
export default class UserController {
  // constructor(private readonly userService: UserService) { }

  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
    exceedHandler,
  })
  @Validate
  /**
   * Create a new user
   * @param {UserCreationDto} user - User creation data validated by Zod schema
   * @returns {Promise<void>}
   * @throws {ResponseError} 500 - When rate limit exceeded
   * @throws {ResponseError} 400 - Invalid input data
   */
  public async create(@ZodInput(ZodUserCreationDto) user: UserCreationDto) {
    users.push({ ...user, id: users.length + 1 } satisfies User);
  }

  @onError({
    func: getUserErrorHandler,
  })
  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
    exceedHandler,
  })
  /**
   * Get user by ID
   * @param {string} id - User ID as string
   * @returns {Promise<User | ResponseError>} User details or error object
   * @throws {ResponseError} 404 - User not found
   * @throws {ResponseError} 400 - Invalid ID format
   */
  public async get(id: string): Promise<User | ResponseError> {
    const userId = tryParseId(id);
    if (typeof userId != "number") return userId satisfies ResponseError;
    const user = users.find((user) => user.id === userId);

    if (!user)
      return {
        status: 404,
        message: "User dose not exist.",
      } satisfies ResponseError;

    return user satisfies User;
  }

  @timeout(20000)
  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
    exceedHandler,
  })
  /**
   * Get all users with masked passwords
   * @returns {Promise<User[]>} List of users with hidden password fields
   * @throws {ResponseError} 500 - When rate limit exceeded
   */
  public async getAll(): Promise<User[]> {
    return users.map(
      (user) =>
        ({
          ...user,
          password: "?",
        } satisfies User)
    );
  }
}
```

This structure not only supports effective code organization but also ensures that each part of the application is working towards the same goal: a scalable, maintainable, and robust API.

### Async Handlers

To maintain cleaner code and improve error handling, the app suggests the `express-async-handler` package that automatically catches exceptions inside of async express routes and passing them to the express error handlers. This allows you to focus on writing the business logic without worrying about try/catch blocks.

### API Documentation

Once the application is running, visit the Swagger UI at http://localhost:3000/api-docs. This automatically generated documentation will provide you with all available routes along with details on request parameters, response structures, and possible error codes.

### Decorators

To prevent abuse of your API, you can utilize throttling, and validation decorators from the `utils-decorators` and `ts-zod-decorators` packages respectively. This packages provides decorators that can be applied directly to your service and controller classes.

### Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to create an issue or submit a pull request.

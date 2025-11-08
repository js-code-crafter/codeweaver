# A lightweight framework built on top of Express and TypeScript

## Overview

**Codeweaver** is an unopinionated microframework built with `Express`, `TypeScript`, and `Zod` (v4), seamlessly integrated with `Swagger` for comprehensive API documentation. Its modular architecture for routers promotes scalability and organized development, making it easy to expand and maintain. Routers are automatically discovered and wired up through a conventional folder structure, simplifying project organization and reducing boilerplate. Routers can be nested, allowing you to compose complex route trees by placing sub-routers inside parent router folders. It also uses `utils-decorators`, a collection of middleware utilities (throttling, caching, and error handling) designed to strengthen application resilience.

## Features and Technologies Used

- **Node.js**
- **Express**: A lightweight web framework for building server-side applications in Node.js.
- **TypeScript**: Adds strong typing for enhanced development experience and reduced runtime errors.
- **Modular Router Structure**: Automates importing and mounting routers, ensuring a clean separation of endpoints and logic for easier scalability.
- **Dependency resolver**: A simple dependency resolver that uses a lightweight container to manage and inject dependencies at runtime.
- **Swagger Integration**: Automatically generates interactive API documentation, facilitating easier understanding of available endpoints for developers and consumers.
- **Async Handlers**: Utilizes async/await syntax for cleaner, more maintainable asynchronous code without callback nesting.
- **Zod**: Implements schema validation for input data.
- **Utils-decorators**: A collection of middleware utilities utils-decorators (throttling, caching, and error handling) designed to strengthen application resilience.
- **Logger**: A Winston-based logger (with LogForm) that provides scalable, leveled logging, structured JSON output, and pluggable transports (console and file)

Here's a revised Installation section that explicitly supports pnpm in addition to npm. I kept the formatting and steps intact, adding clear pnpm equivalents.

## Installation

To get started with the project, follow these steps:

1. **Clone the repository**:

   ```bash
   npm i -g codeweaver
   npx codeweaver my-app
   cd my-app
   ```

2. **Clone the repository**:

   Using pnpm:

   ```bash
   pnpm i
   ```

   Using npm:

   ```bash
   npm i
   ```

3. **Run the application**:

   ```bash
   npm start
   ```

4. **Visit the Swagger UI**: Open your browser and go to `http://localhost:3000/api-docs` to view the automatically generated API documentation.

5. **Build**: Compile the TypeScript files for the production environment:

   ```bash
   npm run build
   npm run serve
   ```

## Sample Project Structure

**/src**  
├── **/routers** `Directory containing all router files`  
│ ├── **/users** `Routers for user-related endpoints`  
│ │ ├── index.router.ts `/users`  
│ │ ├── user-router2.router.ts `/users/user-router2`  
│ │ ├── user.controller.ts  
│ │ ├── user.service.ts  
│ │ └── user.dto.ts  
│ ├── **/products** `Routers for product-related endpoints`  
│ │ ├── index.router.ts `/products`  
│ │ ├── product.controller.ts  
│ │ ├── product.service.ts  
│ │ ├── **/dtos**  
│ │ │ └── product.dto.ts  
| | │ └── product-types.dto.ts  
│ ├── **/orders** `Routers for order-related endpoints`  
│ │ ├── index.router.ts `/orders`  
│ │ ├── order.controller.ts  
│ │ ├── order.controller.spec.ts  
│ │ ├── order.service.ts  
│ │ └── order.service.spec.ts  
│ └── index.router.ts `Home page`  
│ └── app.controller.ts `Home page`  
├── app.ts `Main application file`  
├── config.ts `Application configuration file`  
└── ... `Other files (middleware, models, etc.)`

### Router Directory

Each router file in the `/routers` directory is organized to handle related endpoints. The `app.ts` file automatically imports all routers and mounts them on the main Express application, making it straightforward to add new routes without touching central code.

Files ending with `.router.ts` or `.router.js` are automatically included in the router list and can be reused for various purposes within the application.

Example of a basic router:

```typescript
import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import UserController from "./user.controller";
import { resolve } from "@/utilities/container";

const router = Router();
const userController = resolve(UserController);

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
    const user = await userController.validateUserCreationDto(req.body);
    await userController.create(user);
    res.status(201).send();
  })
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A user object
 *       404:
 *         description: user not found
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = await userController.validateId(req.params.id);
    const user = await userController.get(id);
    res.json(user);
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
    res.json(await userController.getAll());
  })
);

export = router;
```

### Controllers

**Controllers** in this Express TypeScript framework act as the intermediary between the incoming HTTP requests and the application logic. Each controller is responsible for handling specific routes and defining the behavior associated with those routes. This organization promotes a clean architecture by separating business logic, validation, and routing concerns.

Controllers can be organized within the router folders, allowing them to stay closely related to their respective routes. However, they are not limited to this structure and can be placed anywhere within the `src` folder as needed, providing flexibility in organizing the codebase.
Controllers leverage decorators from the `utils-decorators` package to implement throttling, caching, and error handling gracefully.
For example, in the provided `UserController`, the `createUser` method demonstrates how to apply error handling through decorators. It also employs `@rateLimit` to restrict the number of allowed requests within a specified timeframe, effectively guarding against too many rapid submissions. When an error arises, the `@onError` decorator provides a systematic way to handle exceptions, allowing for logging or other error management processes to be performed centrally.

Here’s a brief breakdown of key components used in the `UserController`:

```typescript
import {
  ZodUserCreationDto,
  UserCreationDto,
  UserDto,
  ZodUserDto,
} from "./dto/user.dto";
import { memoizeAsync, onError, rateLimit, timeout } from "utils-decorators";
import { ResponseError } from "@/utilities/error-handling";
import { convert, stringToInteger } from "@/utilities/conversion";
import config from "@/config";
import { users } from "@/db";
import { User } from "@/entities/user.entity";
import { MapAsyncCache } from "@/utilities/cache/memory-cache";
import { Injectable } from "@/utilities/container";

function exceedHandler() {
  const message = "Too much call in allowed window";
  throw new ResponseError(message, 429);
}

function invalidInputHandler(e: ResponseError) {
  const message = "Invalid input";
  throw new ResponseError(message, 400, e?.message);
}

const usersCache = new MapAsyncCache<UserDto[]>(config.cacheSize);
const userCache = new MapAsyncCache<UserDto>(config.cacheSize);

@Injectable()
/**
 * Controller for handling user-related operations
 * @class UserController
 * @desc Provides methods for user management including CRUD operations
 */
export default class UserController {
  // constructor(private readonly userService: UserService) { }

  @onError({
    func: invalidInputHandler,
  })
  /**
   * Validates a string ID and converts it to a number.
   *
   * @param {string} id - The ID to validate and convert.
   * @returns {number} The numeric value of the provided ID.
   */
  public async validateId(id: string): Promise<number> {
    return stringToInteger(id);
  }

  @onError({
    func: invalidInputHandler,
  })
  /**
   * Validates and creates a new User from the given DTO.
   *
   * @param {UserCreationDto} user - The incoming UserCreationDto to validate and transform.
   * @returns {User} A fully formed User object ready for persistence.
   */
  public async validateUserCreationDto(user: UserCreationDto): Promise<User> {
    const newUser = await ZodUserCreationDto.parseAsync(user);
    return { ...newUser, id: users.length + 1 };
  }

  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Create a new user
   * @param {User} user - User creation data validated by Zod schema
   * @returns {Promise<void>}
   * @throws {ResponseError} 500 - When rate limit exceeded
   * @throws {ResponseError} 400 - Invalid input data
   */
  public async create(user: User): Promise<void> {
    users.push(user);
    await userCache.set(user.id.toString(), user as User);
    await usersCache.delete("key");
  }

  @memoizeAsync({
    cache: usersCache,
    keyResolver: () => "key",
    expirationTimeMs: config.memoizeTime,
  })
  @timeout(config.timeout)
  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Get all users
   * @returns {Promise<UserDto[]>} List of users with hidden password fields
   * @throws {ResponseError} 500 - When rate limit exceeded
   */
  public async getAll(): Promise<UserDto[]> {
    return users as UserDto[];
  }

  @memoizeAsync({
    cache: userCache,
    keyResolver: (id: number) => id.toString(),
    expirationTimeMs: config.memoizeTime,
  })
  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Get user by ID
   * @param {number} id - User ID as string
   * @returns {Promise<UserDto>} User details or error object
   * @throws {ResponseError} 404 - User not found
   * @throws {ResponseError} 400 - Invalid ID format
   */
  public async get(id: number): Promise<UserDto> {
    const user = users.find((user) => user.id === id);
    if (user == null) {
      throw new ResponseError("Product not found");
    }
    return convert(user!, ZodUserDto);
  }
}
```

This structure not only supports effective code organization but also ensures that each part of the application is working towards the same goal: a scalable, maintainable, and robust API.

### Async Handlers

To maintain cleaner code and improve error handling, the app suggests the `express-async-handler` package that automatically catches exceptions inside of async express routes and passing them to the express error handlers. This allows you to focus on writing the business logic without worrying about try/catch blocks.

### API Documentation

Once the application is running, visit the Swagger UI at http://localhost:3000/api-docs. This automatically generated documentation will provide you with all available routes along with details on request parameters, response structures, and possible error codes.

### Decorators

To prevent abuse of your API, you can utilize throttling, caching, and error handling decorators from the `utils-decorators` packages respectively. This packages provides decorators that can be applied directly to your service and controller classes.

### Contributing

Contributions are welcome! If you have suggestions for improvements or new features, feel free to create an issue or submit a pull request.

import { User, ZodUserCreationDto, UserCreationDto } from "./dto/user.dto";
import { onError, rateLimit, timeout } from "utils-decorators";
import { Validate, ZodInput } from "@pkg/ts-zod-decorators";
import { ResponseError } from "@/types";
import { tryParseId } from "@/utilities";

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

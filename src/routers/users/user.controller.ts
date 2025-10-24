import { ZodUserCreationDto, UserCreationDto, UserDto } from "./dto/user.dto";
import { memoizeAsync, onError, rateLimit, timeout } from "utils-decorators";
import { Validate, ZodInput } from "ts-zod4-decorators";
import { ResponseError } from "@/utilities/error-handling";
import { toInteger } from "@/utilities/conversion";
import config from "@/config";
import { users } from "@/db";
import { User } from "@/entities/user.entity";
import { MapAsyncCache } from "@/utilities/cache/memory-cache";

function exceedHandler() {
  const message = "Too much call in allowed window";
  throw new ResponseError(message, 429);
}

function getUserErrorHandler(e: Error) {
  const message = "User not found.";
  throw new ResponseError(message, 404, e.message);
}

const usersCache = new MapAsyncCache<UserDto[]>(config.cacheSize);
const userCache = new MapAsyncCache<UserDto>(config.cacheSize);

/**
 * Controller for handling user-related operations
 * @class UserController
 * @desc Provides methods for user management including CRUD operations
 */
export default class UserController {
  // constructor(private readonly userService: UserService) { }

  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
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
    let newUser: User = { ...user, id: users.length + 1 };
    users.push(newUser);
    userCache.set(newUser.id.toString(), newUser as UserDto);
    usersCache.delete("key");
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
   * @returns {Promise<User[]>} List of users with hidden password fields
   * @throws {ResponseError} 500 - When rate limit exceeded
   */
  public async getAll(): Promise<UserDto[]> {
    return users as UserDto[];
  }

  @memoizeAsync({
    cache: userCache,
    keyResolver: (id: string) => id,
    expirationTimeMs: config.memoizeTime,
  })
  @onError({
    func: getUserErrorHandler,
  })
  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Get user by ID
   * @param {string} id - User ID as string
   * @returns {Promise<User>} User details or error object
   * @throws {ResponseError} 404 - User not found
   * @throws {ResponseError} 400 - Invalid ID format
   */
  public async get(id: string): Promise<UserDto> {
    const response = toInteger(id);
    const user = users.find((user) => user.id === response);
    if (user == null) {
      throw new ResponseError("User dose not exist.", 404);
    }
    return user as UserDto;
  }
}

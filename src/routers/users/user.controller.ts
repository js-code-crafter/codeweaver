import { UserCreationDto, UserDto, ZodUserDto } from "./dto/user.dto";
import { memoizeAsync, onError, rateLimit, timeout } from "utils-decorators";
import { ResponseError } from "@/utilities/error-handling";
import { convert, stringToInteger } from "@/utilities/conversion";
import config from "@/config";
import { users } from "@/db";
import { User, ZodUser } from "@/entities/user.entity";
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
    return await convert(user, ZodUser);
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
    return await Promise.all(
      users.map(async (user) => await convert(user, ZodUserDto))
    );
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
    return convert(user, ZodUserDto);
  }
}

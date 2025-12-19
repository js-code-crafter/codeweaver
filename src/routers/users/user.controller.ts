import { UserCreationDto, UserDto, ZodUserDto } from "./dto/user.dto";
import { ResponseError } from "@/core/error";
import { convert, stringToInteger } from "@/core/helpers";
import { config } from "@/config";
import { users } from "@/db";
import { User, ZodUser } from "@/entities/user.entity";
import { Invalidate, MapAsyncCache, Memoize } from "@/core/cache";
import { Injectable } from "@/core/container";
import { parallelMap } from "@/core/parallel";
import { ErrorHandler, LogMethod, Timeout } from "@/core/middlewares";
import { RateLimit } from "@/core/rate-limit";

async function invalidInputHandler(e: ResponseError) {
  const message = "Invalid input";
  throw new ResponseError(message, 400, e?.message);
}

const usersCache = new MapAsyncCache<UserDto[]>(config.cacheSize);

@Injectable()
/**
 * Controller for handling user-related operations
 * @class UserController
 * @desc Provides methods for user management including CRUD operations
 */
export default class UserController {
  // constructor(private readonly userService: UserService) { }

  @ErrorHandler(invalidInputHandler)
  /**
   * Validates a string ID and converts it to a number.
   *
   * @param {string} id - The ID to validate and convert.
   * @returns {number} The numeric value of the provided ID.
   */
  public async validateId(id: string): Promise<number> {
    return stringToInteger(id);
  }

  @ErrorHandler(invalidInputHandler)
  /**
   * Validates and creates a new User from the given DTO.
   *
   * @param {UserCreationDto} user - The incoming UserCreationDto to validate and transform.
   * @returns {User} A fully formed User object ready for persistence.
   */
  public async validateUserCreationDto(user: UserCreationDto): Promise<User> {
    return await convert(user, ZodUser);
  }

  @Invalidate(usersCache)
  @RateLimit(config.rateLimitTimeSpan, config.rateLimitAllowedCalls)
  /**
   * Create a new user
   * @param {User} user - User creation data validated by Zod schema
   * @returns {Promise<void>}
   * @throws {ResponseError} 500 - When rate limit exceeded
   * @throws {ResponseError} 400 - Invalid input data
   */
  public async create(user: User): Promise<void> {
    users.push(user);
  }

  @Memoize(usersCache)
  @Timeout(config.timeout)
  @RateLimit(config.rateLimitTimeSpan, config.rateLimitAllowedCalls)
  /**
   * Get all users
   * @returns {Promise<UserDto[]>} List of users with hidden password fields
   * @throws {ResponseError} 500 - When rate limit exceeded
   */
  public async getAll(signal?: AbortSignal): Promise<(UserDto | null)[]> {
    return await parallelMap(users, async (user) =>
      signal?.aborted == false
        ? await convert<User, UserDto>(user!, ZodUserDto)
        : null
    );
  }

  @Memoize(usersCache)
  @RateLimit(config.rateLimitTimeSpan, config.rateLimitAllowedCalls)
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
      throw new ResponseError("User not found");
    }
    return convert(user, ZodUserDto);
  }
}

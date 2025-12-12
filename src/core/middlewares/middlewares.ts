import { config } from "@/config";
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ResponseError } from "@/core/error";
import { logger } from "@/core/logger";
import { JwtOptions, RouterFn, UserPayload, UserRequest } from "./basic-types";
import passport, {
  AuthenticateCallback,
  AuthenticateOptions,
  Strategy,
} from "passport";

/**
 * Simple request logger middleware.
 * Logs the HTTP method and URL of each incoming request at the "Request" context.
 *
 * @param req - Express HTTP request object
 * @param res - Express HTTP response object
 * @param next - Next middleware function
 */
export function requestLogger<
  UserIdType = string | number
>(): RouterFn<UserIdType> {
  return async (req, _res, next) => {
    const { method, url } = req;
    logger.info(
      `Method=${method}, Url=${url}, User Id=${req.user?.id}, IP=${req.ip}, Agent=${req.headers["user-agent"]}`,
      "Request",
      {
        user: req.user,
        body: req.body,
        query: req.query,
        params: req.params,
        headers: req.headers,
        cookies: req.cookies,
      }
    );
    next();
  };
}

/**
 * Factory to create a middleware that authenticates a JWT from the Authorization header.
 * Validates the token using the configured secret key and optional JWT claims.
 *
 * Behavior:
 * - Extracts the token from the Authorization header (Bearer <token>).
 * - Verifies the token with jwt.verify using config.jwtSecretKey and optional options.
 * - Attaches the decoded payload as req.user.
 * - Calls await next() on success.
 * - Throws a 401 ResponseError if token is missing or invalid.
 *
 * @param options Optional JWT validation constraints.
 * @returns Express middleware function.
 */
export function authenticateToken<UserIdType = string | number>(
  options: JwtOptions
): RouterFn<UserIdType> {
  return async (req, _res, next) => {
    let authHeader = req.header("Authorization");
    const token = authHeader?.split(" ")[1];

    if (token == null) {
      throw new ResponseError("Authentication failed: Token not found.", 401);
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecretKey, options);
      req.user = decoded as UserPayload<UserIdType>;
      next();
    } catch {
      throw new ResponseError("Authentication failed: Token is invalid.", 401);
    }
  };
}

/**
 * Utility function to authenticate a user using passport.authenticate.
 * Throws a 401 ResponseError if authentication fails.
 *
 * @param req - Express HTTP request object
 * @param strategy - Passport strategy to use for authentication
 * @param options - Optional authentication options
 * @param callback - Optional callback function
 * @returns Express middleware function
 */
export function authenticate<UserIdType = string | number>(
  req: UserRequest<UserIdType>,
  strategy: string | string[] | Strategy,
  options: AuthenticateOptions,
  callback?: AuthenticateCallback | ((...args: any[]) => any)
) {
  passport.authenticate(
    strategy,
    options,
    async (
      error: any,
      user?: Express.User | false | null,
      info?: object | string | Array<string | undefined>,
      status?: number | Array<number | undefined>
    ) => {
      if (error) throw new ResponseError("Authentication failed.", 401, error);
      if (!user) throw new ResponseError("Authentication failed.", 401);
      await callback?.(error, user, info, status);
      req.user = user;
    }
  );
}

/**
 * Middleware to authenticate a user using passport.authenticate.
 * Throws a 401 ResponseError if authentication fails.
 *
 * @param strategy - Passport strategy to use for authentication
 * @param options - Optional authentication options
 * @param callback - Optional callback function
 * @returns Express middleware function
 */
export function authenticatePassport<UserIdType = string | number>(
  strategy: string | string[] | Strategy,
  options?: AuthenticateOptions,
  callback?: AuthenticateCallback | ((...args: any[]) => any),
  authenticationFn?: (
    req: UserRequest<UserIdType>,
    strategy: string | string[] | Strategy,
    options: AuthenticateOptions,
    callback?: AuthenticateCallback | ((...args: any[]) => any)
  ) => any
): RouterFn<UserIdType> {
  return async (req: UserRequest<UserIdType>, _res, next) => {
    await (authenticationFn ?? authenticate)(
      req,
      strategy,
      options ?? {},
      callback
    );
    next();
  };
}

/**
 * Timeout middleware to enforce request time limits.
 * Starts a timer for the given duration and, if the response has not finished
 * by then, responds with HTTP 503 (Request timed out).
 * When the response finishes, invokes onFinish with the timer reference and clears it.
 *
 * @param milliseconds Duration before timing out the request (in ms)
 * @param onFinish Callback invoked when the response finishes, receiving the timer
 * @returns Express middleware function
 */
export function timeout(
  milliseconds: number,
  onFinish: (timer: NodeJS.Timeout) => void
): RouterFn {
  return async (_req, res, next) => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(503).json({ message: "Request timed out" });
      }
    }, milliseconds);

    res.once("finish", () => {
      onFinish(timer);
      clearTimeout(timer);
    });
    res.once("close", () => clearTimeout(timer));
    next();
  };
}

// Map of in-flight requests per user
export const inFlightMap: Map<string, number> = new Map();

/**
 * Utility function to generate a hash for a request.
 * The hash is based on the method, URL and body of the request.
 *
 * @param req - Express HTTP request object
 * @returns A string representation of the hash
 */
export function hashRequest<UserIdType = string | number>(
  req: UserRequest<UserIdType>
): string {
  const { method, url, body } = req;
  const payload = JSON.stringify(body ?? {});
  const str = `${method}:${url}:${payload}`;
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

/**
 * Per-user in-flight request debounce.
 * Prevents identical in-flight requests from being processed concurrently within a
 * short time span by the same user.
 *
 * - Uses a lightweight hash of the request (method, url, body) together with a per-user key.
 * - If a similar request was processed within config.debounceTimeSpan, responds with 429
 *   and a Retry-After header indicating the wait time.
 * - Stores the timestamp of the last in-flight occurrence in a map.
 * - Optionally cleans up the in-flight key after the response finishes if
 *   cleanUpAfterResponse is true.
 *
 * @param cleanUpAfterResponse If true, cleans up the in-flight key after the response finishes.
 * @returns Express middleware function
 */
export function debounce<UserIdType = string | number>(
  cleanUpAfterResponse: boolean = false,
  inFlight: Map<string, number> = inFlightMap,
  hashFunction: (req: UserRequest<UserIdType>) => string = hashRequest
) {
  return async (
    req: UserRequest<UserIdType>,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user?.id ?? "anonymous";
    const key = `${userId}:${hashFunction(req)}`;

    const now = Date.now();
    const last = inFlight.get(key) ?? 0;

    if (now - last < config.debounceTimeSpan) {
      res.header(
        "Retry-After",
        String(Math.ceil((config.debounceTimeSpan - (now - last)) / 1000))
      );
      return res
        .status(429)
        .json({ error: "Please wait before repeating this action." });
    }

    inFlight.set(key, now);

    if (cleanUpAfterResponse) {
      res.on("finish", () => {
        inFlight.delete(key);
      });
    }

    next();
  };
}

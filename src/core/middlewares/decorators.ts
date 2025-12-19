import { logger } from "@/core/logger";
import { ResponseError } from "@/core/error";
import jwt from "jsonwebtoken";
import { config } from "@/config";
import { JwtOptions, UserPayload, UserRequest } from "./basic-types";
import { createMethodDecorator } from "@/core/helpers/decorators";
import { AsyncFn } from "@/core/helpers";
import { authenticate, hashRequest, inFlightMap } from "./middlewares";
import { AuthenticateCallback, AuthenticateOptions, Strategy } from "passport";

/**
 * Decorator: Log a request when the controller method is invoked.
 */
export const LogRequest = createMethodDecorator<[], [UserRequest]>(
  async ([], [req]) => {
    const { method, url } = req;
    logger.info(
      `Request Method=${method}, Url=${url}, User Id=${req.user?.id}, IP=${req.ip}, Agent=${req.headers["user-agent"]}`,
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
    return null;
  }
);

/**
 * Decorator: Log a method invocation with arguments and result.
 */
export const LogMethod = createMethodDecorator<[], [UserRequest]>(
  async ([], [], method, args, classInstance) => {
    const startTime = process.hrtime.bigint();
    const result = await method.apply(classInstance, args);
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000;
    logger.info("Method arguments and result", "Method", {
      args,
      result,
      duration,
      reqPerSec: 1000 / duration,
    });
    return result;
  }
);

/**
 * Decorator: Authenticate token and attach user to req.
 * Internally uses the existing authenticateToken middleware logic without changing route signatures.
 */
export const AuthenticateToken = createMethodDecorator<
  [JwtOptions | undefined],
  [UserRequest]
>(async ([options], [req]) => {
  const tokenHeader = req.header("Authorization");
  const token = tokenHeader?.split(" ")[1];
  if (token == null) {
    throw new ResponseError("Authentication failed: Token not found.", 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecretKey, options);
    req.user = decoded as UserPayload;
    return null;
  } catch (error: unknown) {
    let message = "";
    if (error instanceof Error) message = error.message;
    throw new ResponseError(
      "Authentication failed: Token is invalid.",
      401,
      message
    );
  }
});

/**
 * Decorator: Apply authentication using passport.authenticate
 * Internally uses the existing authenticatePassport middleware logic without changing route signatures.
 */
export const Authenticate = createMethodDecorator<
  [
    string | string[] | Strategy,
    AuthenticateOptions | undefined,
    AuthenticateCallback | ((...args: any[]) => Promise<any>) | undefined,
    (
      | ((
          req: UserRequest,
          strategy: string | string[] | Strategy,
          options: AuthenticateOptions,
          callback?: AuthenticateCallback | ((...args: any[]) => Promise<any>)
        ) => any)
      | undefined
    )
  ],
  [UserRequest]
>(async ([strategy, options, callback, authenticationFn], [req]) => {
  await (authenticationFn ?? authenticate)(
    req,
    strategy,
    options ?? {},
    callback
  );

  if (req.user?.id === null) {
    throw new ResponseError("Authentication failed.", 401);
  }

  return null;
});

/**
 * Decorator: Apply a timeout to the controller method.
 * Mirrors the timeout middleware but applied at method level.
 */
export function Timeout(
  milliseconds: number,
  timeoutHandler?: () => Promise<any>
) {
  return createMethodDecorator<[number, (() => Promise<any>) | undefined], []>(
    async ([milliseconds, timeoutHandler], [], method, args, classInstance) => {
      const controller = new AbortController();

      // Create a promise that rejects after the timeout
      let timeoutHandle: NodeJS.Timeout;
      const timeoutPromise = new Promise<any>(async (resolve, reject) => {
        timeoutHandle = setTimeout(() => {
          if (timeoutHandler != null) {
            resolve(timeoutHandler());
          } else {
            controller.abort();
            reject(new ResponseError("Request timed out", 503));
          }
        }, milliseconds);
      });

      // Add the signal to the method arguments
      args.push(controller.signal);

      // Run the original method
      try {
        return await Promise.race([
          timeoutPromise,
          method.apply(classInstance, args),
        ]);
      } finally {
        clearTimeout(timeoutHandle!);
      }
    }
  )(milliseconds, timeoutHandler);
}

/**
 * Decorator: Per-user debounce for a controller method.
 * Mirrors perUserDebounce with optional cleanup after response.
 */
export const Debounce = createMethodDecorator<
  [
    number | undefined,
    Map<string, number> | undefined,
    ((req: UserRequest) => string) | undefined
  ],
  [req: UserRequest]
>(async ([debounceTimeSpan, inFlight, hashFunction], [req]) => {
  // Import the in-flight mechanism from your existing module
  // If inFlight and hashRequest are exported, import them here
  const userId = req.user?.id ?? "anonymous";
  const key =
    `${userId}:` +
    (hashFunction != null ? hashFunction(req) : hashRequest(req));

  const now = Date.now();
  const last = (inFlight ?? inFlightMap).get(key) ?? 0;

  if (now - last < (debounceTimeSpan ?? config.debounceTimeSpan)) {
    throw new ResponseError("Please wait before repeating this action.", 429);
  }

  (inFlight ?? inFlightMap).set(key, now);
  return null;
});

/**
 * Before decorator: run a function before the controller method.
 * You can supply a small hook to run any pre-processing (e.g., logging, metric increment).
 */
export const Before = createMethodDecorator<
  [(method: AsyncFn, ...methodArgs: any[]) => Promise<boolean>],
  any[]
>(async ([callback], _args, method, rawMethodArgs) => {
  return await callback(method, rawMethodArgs);
});

/**
 * After decorator: run a function after the controller method completes.
 * If the controller method returns a Promise, the afterFn runs after it resolves.
 */
export const After = createMethodDecorator<
  [(result: any, method: AsyncFn, ...methodArgs: any[]) => Promise<void>],
  []
>(undefined, async (result, [callback], _args, method, rawMethodArgs) => {
  return await callback(result, method, rawMethodArgs);
});

/**
 * Error handler decorator with a callback
 * The callback receives the error and a context object describing the invocation.
 *
 * @param callback - callback invoked when an error occurs.
 * @returns decorator
 */
export const ErrorHandler = createMethodDecorator<
  [(error: Error) => Promise<void>],
  []
>(async ([callback], [], method, rawMethodArgs, classInstance) => {
  try {
    return await method.apply(classInstance, rawMethodArgs);
  } catch (error: unknown) {
    return await callback(
      error instanceof Error ? (error as Error) : new Error("Unexpected error!")
    );
  }
});

/**
 * Guard decorator: restrict access to a controller method.
 *
 * @param callback - callback invoked to check if the request is allowed: (req) => Promise<boolean>
 * @returns decorator
 */
export const Guard = createMethodDecorator<
  [(req: UserRequest) => Promise<boolean>],
  [UserRequest]
>(async ([callback], [req]) => {
  const isAllowed = await callback(req);
  if (!isAllowed) {
    throw new ResponseError("Forbidden", 403);
  }
  return null;
});

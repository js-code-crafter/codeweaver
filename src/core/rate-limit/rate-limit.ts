import { Response, NextFunction } from "express";
import { RateLimitStore } from "./basic-types";
import { MemoryRateLimitStore } from "./memory-store";
import { ResponseError } from "@/core/error";
import { config } from "@/config";
import { resolve } from "@/core/container";
import { UserRequest } from "@/core/middlewares";
import { createMethodDecorator } from "../helpers";

const globalBucketId = "[global]";

/**
 * Rate limiter factory for per-user (or global) limits.
 *
 * @param rateLimitTimeSpan - window duration in milliseconds
 * @param rateLimitAllowedCalls - bucket capacity (max tokens)
 * @param bucketName - true for a global bucket, false for per-user buckets
 * @param store - optional RateLimitStore instance; if omitted, defaults to in-memory
 * @returns Express middleware function
 */
export function rateLimitMiddleware<UserIdType = string>(
  rateLimitTimeSpan: number = config.rateLimitTimeSpan,
  rateLimitAllowedCalls: number = config.rateLimitAllowedCalls,
  exceedHandler?: (next: NextFunction) => Promise<void>,
  bucketName: string = globalBucketId,
  store: RateLimitStore = resolve(MemoryRateLimitStore)
) {
  return async (
    req: UserRequest<UserIdType>,
    _res: Response,
    next: NextFunction
  ) => {
    let bucketId: string;
    if (bucketName == globalBucketId) {
      bucketId = `${bucketName}."${req.baseUrl}${req.path}:${req.method}`;
    } else {
      const user = req.user?.id ?? "[anonymous]";
      bucketId = `${bucketName}."${req.baseUrl}${req.path}:${req.method}."${user}`; // per-user (anonymous if no user)
    }

    const now = Date.now();

    const bucket = await store.getBucket(
      bucketId,
      rateLimitAllowedCalls,
      rateLimitTimeSpan
    );

    if (bucket.tokens >= 1) {
      next();
    }

    if (exceedHandler != null) {
      return await exceedHandler(next);
    } else {
      throw new ResponseError(
        "Too many requests, please try again later.",
        429
      );
    }
  };
}

/**
 * Rate limit decorator for controller methods.
 * @param rateLimitTimeSpan - window duration in milliseconds
 * @param rateLimitAllowedCalls - bucket capacity (max tokens)
 * @param bucketName
 * @param store - optional RateLimitStore instance; if omitted, defaults to in-memory
 *
 * Example usage:
 *   class UserController {
 *     @tokenBucketRateLimit(60000, 20, false) // 20 calls per minute per user
 *     async create(...) { ... }
 *   }
 */
export function RateLimit(
  rateLimitTimeSpan: number = config.rateLimitTimeSpan,
  rateLimitAllowedCalls: number = config.rateLimitAllowedCalls,
  exceedHandler?: () => Promise<any>,
  bucketName: string = globalBucketId,
  store: RateLimitStore = resolve(MemoryRateLimitStore)
) {
  return createMethodDecorator<
    [number, number, (() => Promise<any>) | undefined, string, RateLimitStore],
    [UserRequest]
  >(
    async (
      [
        rateLimitTimeSpan,
        rateLimitAllowedCalls,
        exceedHandler,
        bucketName,
        store,
      ],
      [],
      method,
      args,
      classInstance
    ) => {
      let bucketId: string;
      if (bucketName == globalBucketId) {
        bucketId = `${bucketName}."${classInstance.constructor.name}:${method.name}"`;
      } else {
        // Try to locate a real Express Request object in arguments
        const reqCandidate = args[0] ?? null;
        const userFromReq: any = reqCandidate?.user;
        const userId = userFromReq?.id ? String(userFromReq.id) : "[anonymous]";

        // Bucket identity
        bucketId = `${bucketName}."${classInstance.constructor.name}:${method.name}".${userId}`; // per-user (anonymous if no user)
      }

      const bucket = await store.getBucket(
        bucketId,
        rateLimitAllowedCalls,
        rateLimitTimeSpan
      );

      if (bucket.tokens >= 1) {
        return await method.apply(classInstance, args);
      }

      if (exceedHandler != null) {
        return await exceedHandler();
      } else {
        throw new ResponseError(
          "Too many requests, please try again later.",
          429
        );
      }
    }
  )(rateLimitTimeSpan, rateLimitAllowedCalls, exceedHandler, bucketName, store);
}

import { ResponseError } from "./response-error";

/**
 * A generic alias representing a tuple of [result, error].
 * - result is either T or undefined if an error occurred
 * - error is either a ResponseError or undefined if the operation succeeded
 */
export type ReturnInfo<T> = [T | undefined, ResponseError | undefined];

/**
 * A Promise-wrapped version of ReturnInfo.
 */
export type AsyncReturnInfo<T> = Promise<ReturnInfo<T>>;

/**
 * Executes a function and captures a potential error as a ReturnInfo tuple.
 *
 * Returns a two-element tuple: [value, error]
 * - value: the function result if it succeeds; undefined if an exception is thrown
 * - error: the caught Error wrapped as a ResponseError (or the provided error) if the function throws; undefined if the function succeeds
 *
 * This utility helps avoid try/catch blocks at call sites by returning both the
 * result and any error in a single value.
 *
 * @template T
 * @param func - The function to execute
 * @param error - The error object to return when an exception occurs (typically a ResponseError). If no error is provided, undefined is used.
 * @returns ReturnInfo<T> A tuple: [value or undefined, error or undefined]
 */
export function invoke<T>(
  func: () => T,
  error: ResponseError | undefined
): ReturnInfo<T> {
  try {
    return [func(), undefined];
  } catch {
    return [undefined, error];
  }
}

/**
 * Creates a successful result from a ReturnInfo tuple.
 *
 * Given a ReturnInfo<T> of the form [value, error], this returns the value
 * when the operation succeeded, or undefined when there was an error.
 *
 * @template T
 * @param input - The ReturnInfo tuple
 * @returns The successful value of type T, or undefined if there was an error
 */
export function successfulResult<T>(result: ReturnInfo<T>): T | undefined {
  return result[0];
}

/**
 * Normalizes and wraps an error into the common ReturnInfo shape.
 *
 * The function accepts a ReturnInfo-shaped input and extracts the error portion.
 * If a non-Error value is provided, you should wrap it as a ResponseError beforehand.
 * If the error is already a ResponseError, it is returned as-is.
 *
 * @template T
 * @param result - The error to wrap, either as a ResponseError or as a ReturnInfo<T> where the error is at index 1
 * @returns The extracted or wrapped ResponseError, or undefined if there is no error
 */
export function error<T>(result: ReturnInfo<T>): ResponseError | undefined {
  return result[1];
}

/**
 * Determines whether a ReturnInfo value represents a successful operation.
 *
 * A result is considered successful when there is no error (i.e., the error portion is undefined).
 *
 * @template T
 * @param result - The ReturnInfo tuple [value | undefined, error | undefined]
 * @returns true if there is no error; false otherwise
 */
export function isSuccessful<T>(result: ReturnInfo<T>): boolean {
  return result[1] === undefined;
}

/**
 * Indicates whether a ReturnInfo value represents an error.
 *
 * This is the logical negation of isSuccess for a given ReturnInfo.
 *
 * @template T
 * @param result - The ReturnInfo tuple [value | undefined, error | undefined]
 * @returns true if an error is present (i.e., error is not undefined); false otherwise
 */
export function hasError<T>(result: ReturnInfo<T>): boolean {
  return result[1] !== undefined;
}

/**
 * Indicates whether a ReturnInfo value represents an error.
 *
 * This is the logical negation of isSuccess for a given ReturnInfo.
 *
 * @template T
 * @param result - The ReturnInfo tuple [value | undefined, error | undefined]
 * @returns true if an error is present (i.e., error is not undefined); false otherwise
 */
export function then<T>(
  result: ReturnInfo<T>,
  callback: (value: T) => void
): void {
  if (isSuccessful(result)) {
    callback(successfulResult(result)!);
  }
}

/**
 * Indicates whether a ReturnInfo value represents an error.
 *
 * This is the logical negation of isSuccess for a given ReturnInfo.
 *
 * @template T
 * @param result - The ReturnInfo tuple [value | undefined, error | undefined]
 * @returns true if an error is present (i.e., error is not undefined); false otherwise
 */
export function catchIfHasError<T>(
  result: ReturnInfo<T>,
  callback: (error: ResponseError) => void
): void {
  if (hasError(result)) {
    callback(error(result)!);
  }
}

/**
 * Indicates whether a ReturnInfo value represents an error.
 *
 * This is the logical negation of isSuccess for a given ReturnInfo.
 *
 * @template T
 * @param result - The ReturnInfo tuple [value | undefined, error | undefined]
 * @returns true if an error is present (i.e., error is not undefined); false otherwise
 */
export function throwIfHasError<T>(result: ReturnInfo<T>): void {
  if (hasError(result)) {
    throw error(result);
  }
}

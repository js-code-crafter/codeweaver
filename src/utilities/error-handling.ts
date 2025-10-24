import { Response } from "express";

/**
 * Represents a standardized error response structure for API endpoints.
 *
 * This class models an API-friendly error, carrying a human message plus
 * optional metadata (status, details, input, code, stack). Extends the built-in Error
 * so it works naturally with try/catch blocks.
 */
export class ResponseError extends Error {
  public constructor(
    /**
     * User-facing error message describing what went wrong.
     */
    public message: string,

    /**
     * Optional HTTP status code related to the error (e.g., 400, 404, 500).
     */
    public status?: number,

    /**
     * Optional human-readable details or context about the error.
     */
    public details?: string,

    /**
     * Optional input value that caused the error (useful for logging/diagnostics).
     */
    public input?: string,

    /**
     * Optional application-specific error code (e.g., "INVALID_INPUT").
     */
    public code?: string,

    /**
     * Optional stack trace string (usually provided by runtime).
     * Note: In many environments, stack is inherited from Error; you may
     * not need to redefine it here unless you have a specific reason.
     */
    public stack?: string
  ) {
    // Ensure the base Error class gets the message for standard properties like name, stack, etc.
    super(message);
    // Optional: Set the name to distinguish this error type
    this.name = code ?? "ResponseError";
    // If a custom stack is provided, you might assign it; otherwise, the runtime stack will be used.
    if (stack) this.stack = stack;
  }
}

/**
 * Sends a standardized HTTP error response.
 *
 * This function sets the response status from the provided error (defaulting to 500)
 * and serializes the error object as JSON.
 *
 * @param res - Express Response object to send the error on
 * @param error - Error details to return to the client (must include status or default will be 500)
 */
export function sendHttpError(res: Response, error: ResponseError): void {
  res.status(error.status ?? 500).json(error);
}

/**
 * A generic alias representing a tuple of [result, error].
 * - result is either T or null if an error occurred
 * - error is either a ResponseError or null if the operation succeeded
 */
export type ReturnInfo<T> = [T | null, ResponseError | null];

/**
 * A Promise-wrapped version of ReturnInfo.
 */
export type AsyncReturnInfo<T> = Promise<ReturnInfo<T>>;

/**
 * Executes a function and captures a potential error as a ReturnInfo tuple.
 *
 * Returns a two-element tuple: [value, error]
 * - value: the function result if it succeeds; null if an exception is thrown
 * - error: the caught Error wrapped as a ResponseError (or the provided error) if the function throws; null if the function succeeds
 *
 * This utility helps avoid try/catch blocks at call sites by returning both the
 * result and any error in a single value.
 *
 * @template T
 * @param func - The function to execute
 * @param error - The error object to return when an exception occurs (typically a ResponseError). If no error is provided, null is used.
 * @returns ReturnInfo<T> A tuple: [value or null, error or null]
 */
export function invoke<T>(
  func: () => T,
  error: ResponseError | null
): ReturnInfo<T> {
  try {
    return [func(), null];
  } catch {
    return [null, error];
  }
}

/**
 * Creates a successful result from a ReturnInfo tuple.
 *
 * Given a ReturnInfo<T> of the form [value, error], this returns the value
 * when the operation succeeded, or null when there was an error.
 *
 * @template T
 * @param input - The ReturnInfo tuple
 * @returns The successful value of type T, or null if there was an error
 */
export function successfulResult<T>(input: ReturnInfo<T>): T | null {
  return input[0];
}

/**
 * Normalizes and wraps an error into the common ReturnInfo shape.
 *
 * The function accepts a ReturnInfo-shaped input and extracts the error portion.
 * If a non-Error value is provided, you should wrap it as a ResponseError beforehand.
 * If the error is already a ResponseError, it is returned as-is.
 *
 * @template T
 * @param responseError - The error to wrap, either as a ResponseError or as a ReturnInfo<T> where the error is at index 1
 * @returns The extracted or wrapped ResponseError, or null if there is no error
 */
export function error<T>(responseError: ReturnInfo<T>): ResponseError | null {
  return responseError[1];
}

/**
 * Determines whether a ReturnInfo value represents a successful operation.
 *
 * A result is considered successful when there is no error (i.e., the error portion is null).
 *
 * @template T
 * @param result - The ReturnInfo tuple [value | null, error | null]
 * @returns true if there is no error; false otherwise
 */
export function isSuccessful<T>(result: ReturnInfo<T>): boolean {
  return result[1] === null;
}

/**
 * Indicates whether a ReturnInfo value represents an error.
 *
 * This is the logical negation of isSuccess for a given ReturnInfo.
 *
 * @template T
 * @param result - The ReturnInfo tuple [value | null, error | null]
 * @returns true if an error is present (i.e., error is not null); false otherwise
 */
export function hasError<T>(result: ReturnInfo<T>): boolean {
  return result[1] !== null;
}

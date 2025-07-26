import { Response } from "express";
import { ResponseError } from "./types";

/**
 * Sends a standardized error response
 * @param {Response} res - Express response object
 * @param {ResponseError} error - Error details object
 */
export function sendError(res: Response, error: ResponseError): void {
  res.status(error.status).json(error);
}

/**
 * Parses and validates ID parameter from string to number
 * @param {string} input - Input string to parse
 * @returns {number|ResponseError} Parsed number or error object
 */
export function tryParseId(input: string): number | ResponseError {
  try {
    return parseInt(input) satisfies number;
  } catch {
    return {
      status: 400,
      message: "wrong input",
      details: "The id parameter must be an integer number.",
    } satisfies ResponseError;
  }
}

/**
 * Checks if the provided object is a ResponseError.
 *
 * A ResponseError is an object that contains at least the properties:
 * - message: string
 * - status: number
 *
 * @param obj - The object to check.
 * @returns true if the object is a ResponseError, false otherwise.
 */
export function isResponseError(obj: unknown): boolean {
  return (
    obj != null &&
    typeof obj === "object" &&
    "message" in obj &&
    "status" in obj
  );
}

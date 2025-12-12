import { Response } from "express";
import { ResponseError } from "./response-error";

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

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
    public override message: string,

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
    public override stack?: string
  ) {
    // Ensure the base Error class gets the message for standard properties like name, stack, etc.
    super(message);
  }
}

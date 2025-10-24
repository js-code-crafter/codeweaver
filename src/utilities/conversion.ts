import { ResponseError } from "./error-handling";

/**
 * Helper: normalize and validate a numeric string for integer parsing.
 * This ensures we reject non-integer strings, empty input, or inputs with extra chars.
 */
function parseIntegerStrict(input: string): number {
  // Trim whitespace
  const s = input.trim();

  // Empty or just sign is invalid
  if (s.length === 0 || s === "+" || s === "-") {
    throw new Error("Invalid integer");
  }

  // Use a regex to ensure the entire string is an optional sign followed by digits
  if (!/^[+-]?\d+$/.test(s)) {
    throw new Error("Invalid integer");
  }

  // Safe parse
  const n = Number(s);
  if (!Number.isSafeInteger(n)) {
    throw new Error("Integer out of safe range");
  }

  return n;
}

/**
 * Parses a string input into an integer number with strict validation.
 *
 * If parsing fails, this function throws a ResponseError describing the invalid input.
 *
 * @param input - The string to parse as an integer
 * @returns The parsed integer
 * @throws {ResponseError} When the input cannot be parsed as an integer
 */
export function toInteger(input: string): number {
  try {
    return parseIntegerStrict(input);
  } catch {
    throw new ResponseError(
      "The input parameter must be a valid integer.",
      400
    );
  }
}

/**
 * Parses a string input into a boolean with explicit validation.
 *
 * Accepted true values: "true", "1", "yes", case-insensitive
 * Accepted false values: "false", "0", "no", case-insensitive
 * Any other input is invalid.
 *
 * If parsing fails, this function throws a ResponseError describing the invalid input.
 *
 * @param input - The string to parse as a boolean
 * @returns The parsed boolean
 * @throws {ResponseError} When the input cannot be parsed as a boolean
 */
export function toBoolean(input: string): boolean {
  const s = input.trim().toLowerCase();

  if (["true", "1", "yes", "y"].includes(s)) {
    return true;
  }
  if (["false", "0", "no", "n"].includes(s)) {
    return false;
  }

  throw new ResponseError(
    "The input parameter must be a boolean (e.g., true/false, 1/0).",
    400
  );
}

/**
 * Parses a string input into a number with basic validation.
 *
 * If parsing fails, this function throws a ResponseError describing the invalid input.
 *
 * @param input - The string to parse as a number
 * @returns The parsed number
 * @throws {ResponseError} When the input cannot be parsed as a number
 */
export function toNumber(input: string): number {
  try {
    // Trim and convert
    const n = Number(input.trim());

    // Allow finite numbers only
    if (!Number.isFinite(n)) {
      throw new Error("Invalid number");
    }

    return n;
  } catch {
    throw new ResponseError("The input parameter must be a valid number.", 400);
  }
}

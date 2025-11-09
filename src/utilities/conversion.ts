import { z, ZodRawShape } from "zod";
import { ResponseError } from "./error-handling";
import { parallelMap } from "./parallel/parallel";

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
export function stringToInteger(input: string): number {
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
export function stringToBoolean(input: string): boolean {
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
export function stringToNumber(input: string): number {
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

/**
 * Strictly convert obj (type T1) to T2 using a Zod schema.
 *
 * - Extras in obj are ignored (no throw).
 * - Validates fields with the schema; on failure, throws with a descriptive message.
 * - Returns an object typed as T2 (inferred from the schema).
 *
 * @param data - Source object of type T1
 * @param schema - Zod schema describing the target type T2
 * @returns T2 inferred from the provided schema
 */
export async function convert<T1 extends object, T2 extends object>(
  data: T1,
  schema: z.ZodObject<any>,
  ignoreValidation: boolean = false
): Promise<T2> {
  // Derive the runtime keys from the schema's shape
  const shape = (schema as any)._def?.shape as ZodRawShape | undefined;
  if (!shape) {
    throw new ResponseError("Provided schema has no shape.", 500);
  }

  const keysSchema = Object.keys(shape) as Array<keyof any>;

  // Build a plain object to pass through Zod for validation
  // Include only keys that exist on the schema (ignore extras in obj)
  const candidate: any = {};

  // Iterate schema keys
  await parallelMap(keysSchema, async (key) => {
    if ((data as any).hasOwnProperty(key)) {
      candidate[key] = (data as any)[key];
    }
  });

  // Validate against the schema
  if (ignoreValidation) {
    const result = await schema.safeParseAsync(candidate);
    if (result.success == false) {
      // Modern, non-format error reporting
      const issues = result.error.issues.map((i) => ({
        path: i.path, // where the issue occurred
        message: i.message, // human-friendly message
        code: i.code, // e.g., "too_small", "invalid_type"
      }));

      // You can log issues or throw a structured error
      throw new ResponseError(
        `Validation failed: ${JSON.stringify(issues)}`,
        500
      );
    }

    // Return the validated data typed as T2
    return result.data as T2;
  }

  return candidate as T2;
}

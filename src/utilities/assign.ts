import { z, ZodRawShape } from "zod";
import { ResponseError } from "./types";

/**
 * Strictly convert obj (type T1) to T2 using a Zod schema.
 *
 * - Throws if obj has extra fields beyond those defined in the schema.
 * - Validates fields with the schema; on failure, throws with a descriptive message.
 * - Returns an object typed as T2 (inferred from the schema).
 *
 * @param obj - Source object of type T1
 * @param schema - Zod schema describing the target type T2
 * @returns T2 inferred from the provided schema
 */
export function assignStrictlyFromSchema<T1 extends object, T2 extends object>(
  obj: T1,
  schema: z.ZodObject<any>
): T2 {
  // 1) Derive the runtime keys from the schema's shape
  const shape = (schema as any)._def?.shape as ZodRawShape | undefined;
  if (!shape) {
    throw new ResponseError(
      "assignStrictlyFromSchema: provided schema has no shape.",
      500
    );
  }

  const keysSchema = Object.keys(shape) as Array<keyof any>;

  // 2) Extra keys check
  const objKeys = Object.keys(obj) as Array<keyof T1>;
  const extraKeys = objKeys.filter((k) => !keysSchema.includes(k as any));
  if (extraKeys.length > 0) {
    throw new ResponseError(
      `assignStrictlyFromSchema: source object contains extra field(s) not present on target: ${extraKeys.join(
        ", "
      )}`,
      500
    );
  }

  // 3) Required-field check for T2 (all keys in schema must be present and non-undefined)
  const missingOrUndefined = keysSchema.filter((k) => {
    const v = (obj as any)[k];
    return v === undefined || v === null;
  });
  if (missingOrUndefined.length > 0) {
    throw new ResponseError(
      `assignStrictlyFromSchema: missing required field(s): ${missingOrUndefined.join(
        ", "
      )}`,
      500
    );
  }

  // 4) Build a plain object to pass through Zod for validation
  const candidate: any = {};
  for (const k of keysSchema) {
    if (k in (obj as any)) {
      candidate[k] = (obj as any)[k];
    }
  }

  // 5) Validate against the schema
  const result = schema.safeParse(candidate);
  if (!result.success) {
    // Modern, non-format error reporting
    const issues = result.error.issues.map((i) => ({
      path: i.path, // where the issue occurred
      message: i.message, // human-friendly message
      code: i.code, // e.g., "too_small", "invalid_type"
    }));
    // You can log issues or throw a structured error
    throw new Error(
      `assignStrictlyFromSchema: validation failed: ${JSON.stringify(issues)}`
    );
  }

  // 6) Return the validated data typed as T2
  return result.data as T2;
}

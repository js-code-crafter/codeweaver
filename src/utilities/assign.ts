import { z, ZodRawShape } from "zod";
import { ResponseError } from "./error-handling";

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
export function convertStrictlyFromSchema<T1 extends object, T2 extends object>(
  obj: T1,
  schema: z.ZodObject<any>
): T2 {
  // 1) Derive the runtime keys from the schema's shape
  const shape = (schema as any)._def?.shape as ZodRawShape | undefined;
  if (!shape) {
    throw new ResponseError(
      "convertStrictlyFromSchema: provided schema has no shape.",
      500
    );
  }

  const keysSchema = Object.keys(shape) as Array<keyof any>;

  // 2) Extra keys check
  const objKeys = Object.keys(obj) as Array<keyof T1>;
  const extraKeys = objKeys.filter((k) => !keysSchema.includes(k as any));
  if (extraKeys.length > 0) {
    throw new ResponseError(
      `convertStrictlyFromSchema: source object contains extra field(s) not present on target: ${extraKeys.join(
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
      `convertStrictlyFromSchema: missing required field(s): ${missingOrUndefined.join(
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
    throw new ResponseError(
      `convertStrictlyFromSchema: validation failed: ${JSON.stringify(issues)}`,
      500
    );
  }

  // 6) Return the validated data typed as T2
  return result.data as T2;
}

/**
 * Strictly assign obj (type T1) to T2 using a Zod schema.
 *
 * - Throws if obj has extra fields beyond those defined in the schema.
 * - Validates fields with the schema; on failure, throws with a descriptive message.
 * - Returns an object typed as T2 (inferred from the schema).
 *
 * @param source - Source object of type T1
 * @param destination - Destination object to be populated (typed as T2)
 * @param schema - Zod schema describing the target type T2
 * @returns boolean indicating success (or you can return T2 for direct value)
 */
export function assignStrictlyFromSchema<T1 extends object, T2 extends object>(
  source: T1,
  destination: T2,
  schema: z.ZodObject<any>
): T2 {
  // 1) Ensure there are no extra keys in source beyond the schema keys
  const expectedKeys = new Set(Object.keys(schema.shape as any));
  const sourceKeys = Object.keys(source as any);

  const extraKeys = sourceKeys.filter((k) => !expectedKeys.has(k));
  if (extraKeys.length > 0) {
    throw new ResponseError(
      `assignStrictlyFromSchema: Source has extra field(s) not defined in schema: ${extraKeys.join(
        ", "
      )}`,
      500
    );
  }

  // 2) Validate the subset of keys defined in the schema
  // Build an object that contains only the keys present in source but are part of the schema
  // Then coerce/parse using the schema to ensure type correctness.
  // If you want to allow missing keys (i.e., optional fields), Zod will handle that based on the schema.
  const subsetForSchema: any = {};
  for (const key of Object.keys(schema.shape)) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      subsetForSchema[key] = (source as any)[key];
    }
  }

  // Validate using the schema on the subset (this will also coerce if the schema has transforms)
  const parseResult = schema.safeParse(subsetForSchema);
  if (!parseResult.success) {
    // Build a descriptive error message from the first issue
    const issue = parseResult.error.issues?.[0];
    const path = issue?.path?.length ? issue.path.join(".") : "value";
    const message = issue?.message ?? "Schema validation failed";
    throw new ResponseError(
      `assignStrictlyFromSchema: Validation failed for "${path}": ${message}`,
      500
    );
  }

  // 3) Assign validated values to destination strictly
  // Use the parsed result to ensure types align with the schema
  const validated = parseResult.data as any;

  // Copy only keys that are in the schema
  for (const key of Object.keys(schema.shape)) {
    if (Object.prototype.hasOwnProperty.call(validated, key)) {
      (destination as any)[key] = validated[key];
    }
  }

  return destination;
}

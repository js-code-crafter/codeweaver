import { z } from "zod";
import { ResponseError } from "./error-handling";

/**
 * Strictly assign obj (type T1) to T2 using a Zod schema.
 *
 * - Extras in source are ignored (no throw).
 * - Validates fields with the schema; on failure, throws with a descriptive message.
 * - Returns an object typed as T2 (inferred from the schema).
 *
 * @param source - Source object of type T1
 * @param destination - Destination object to be populated (typed as T2)
 * @param schema - Zod schema describing the target type T2
 * @returns T2 representing the destination after assignment
 */
export default function assign<T1 extends object, T2 extends object>(
  source: T1,
  destination: T2,
  schema: z.ZodObject<any>,
  ignoreNullAndUndefined: false
): T2 {
  // 1) Validate the subset of keys defined in the schema
  // Build an object that contains only the keys present in source but are part of the schema
  const subsetForSchema: any = {};

  // Iterate schema keys
  for (const key of Object.keys(schema.shape)) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (ignoreNullAndUndefined) {
        subsetForSchema[key] = (source as any)[key] ?? subsetForSchema[key];
      } else {
        subsetForSchema[key] = (source as any)[key];
      }
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

  // 2) Assign validated values to destination strictly
  // Use the parsed result to ensure types align with the schema
  const validated = parseResult.data as any;

  // Copy only keys that are in the schema
  for (const key of Object.keys(schema.shape)) {
    if (Object.prototype.hasOwnProperty.call(validated, key)) {
      if (ignoreNullAndUndefined) {
        subsetForSchema[key] = (source as any)[key] ?? subsetForSchema[key];
      } else {
        subsetForSchema[key] = (source as any)[key];
      }
    }
  }

  return destination;
}

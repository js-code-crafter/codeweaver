import { z } from "zod";
import { parallelMap } from "./parallel/parallel";

/**
 * Strictly assign obj (type T1) to T2 using a Zod schema.
 *
 * - Extras in source are ignored.
 * - Validates fields with the schema; on failure, throws with a descriptive message.
 * - Returns an object typed as T2 (inferred from the schema).
 *
 * @param source - Source object of type T1
 * @param destination - Destination object to be populated (typed as T2)
 * @param schema - Zod schema describing the target type T2
 * @returns T2 representing the destination after assignment
 */
export default async function assign<T1 extends object, T2 extends object>(
  destination: T2,
  source: T1,
  destinationSchema?: z.ZodObject<any>
): Promise<T2> {
  let keys = Object.keys(destinationSchema?.shape ?? destination);

  // Iterate schema keys
  await parallelMap(keys, async (key) => {
    if (source.hasOwnProperty(key)) {
      (destination as any)[key] = (source as any)[key];
    }
  });

  if (destinationSchema != null) {
    // Validate using the schema on the subset (this will also coerce if the schema has transforms)
    const parseResult = await destinationSchema.safeParseAsync(destination);
    if (parseResult.success == false) {
      // Build a descriptive error message from the first issue
      const issue = parseResult.error.issues?.[0];
      const path = issue?.path?.length ? issue.path.join(".") : "value";
      const message = issue?.message ?? "Schema validation failed";
      throw new Error(`Validation failed for "${path}": ${message}`);
    }
  }

  return destination;
}

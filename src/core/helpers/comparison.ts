/**
 * Compare two values for deep equality using parallel, recursive checks.
 *
 * This function performs a structural equality check between two values.
 * It handles primitives, null, Date, RegExp, Arrays, and plain objects.
 * Object properties are checked in parallel via Promise.all for potential
 * performance benefits on large objects.
 *
 * Notes:
 * - For objects, keys must match exactly; values are compared recursively.
 * - For Arrays, element order and values must match.
 * - For Dates, times (getTime) must be identical.
 * - For RegExp, string representations (via toString) must match.
 * - Functions are compared by reference (i.e., a === b) since they cannot be
 *   meaningfully “deep-equal” compared here.
 * - If you enable a cycle-detection mechanism, circular references are handled
 *   by tracking seen pairs to avoid infinite recursion.
 *
 * @template T - Type of the first value (and, by structural typing, the second).
 * @param a - The first value to compare.
 * @param b - The second value to compare.
 * @returns A Promise that resolves to true if `a` and `b` are deeply equal, otherwise false.
 *
 * @example
 * true: simple primitives
 * await equal(1, 1); // true
 *
 * @example
 * true: identical objects
 * await equal({ x: 1, y: [2, 3] }, { x: 1, y: [2, 3] }); // true
 *
 * @example
 * false: different structure
 * await equal({ a: 1 }, { a: 1, b: 2 }); // false
 *
 * @example
 * false: different array contents
 * await equal([1, 2], [1, 3]); // false
 */
export async function equal<T>(
  a: T,
  b: T,
  _seen = new WeakMap<object, WeakMap<object, boolean>>()
): Promise<boolean> {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;

  const ta = typeof a;
  if (ta !== "object") return a === b;

  // Cycle detection for objects
  const A = a as object;
  const B = b as object;
  if (_seen.has(A)) {
    const inner = _seen.get(A)!;
    if (inner.has(B as object)) return inner.get(B as object)!;
  } else {
    _seen.set(A, new WeakMap<object, boolean>());
  }

  // Update trace
  _seen.get(A)!.set(B as object, true);

  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  if (a instanceof RegExp && b instanceof RegExp)
    return a.toString() === b.toString();

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== (b as any).length) return false;
    const checks = a.map((_, i) => equal((a as any)[i], (b as any)[i], _seen));
    const results = await Promise.all(checks);
    return results.every(Boolean);
  }

  const aKeys = Object.keys(a as Object);
  const bKeys = Object.keys(b as Object);
  if (aKeys.length !== bKeys.length) return false;
  const keySet = new Set<string>(aKeys);
  for (const k of bKeys) if (!keySet.has(k)) return false;

  const checks = aKeys.map((k) => equal((a as any)[k], (b as any)[k], _seen));
  const results = await Promise.all(checks);
  return results.every(Boolean);
}

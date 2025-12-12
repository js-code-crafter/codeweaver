/**
 * Generate a range of numbers.
 *
 * Creates an array of numbers starting at `start`, up to (and optionally including)
 * `end`, incrementing by `step`. The function supports both positive and negative steps.
 *
 * @param start - The starting value of the range (inclusive by default).
 * @param end - The end value of the range. The range will stop before this value unless you enable `inclusiveEnd`.
 * @param step - The difference between successive numbers. Must be non-zero. Defaults to 1.
 * @param inclusiveEnd - If true, includes the `end` value in the result (when stepping towards it). Defaults to false.
 * @returns An array of numbers representing the generated range.
 *
 * @throws If `step` is 0.
 *
 * @example
 * [1, 2, 3, 4, 5]
 * range(1, 6);
 *
 * @example
 * [1, 3, 5]
 * range(1, 6, 2);
 *
 * @example
 * [1, 2, 3, 4, 5] (inclusive end)
 * range(1, 5, 1, true);
 *
 * @example
 * [5, 3, 1] (negative step, exclusive end)
 * range(5, 0, -2);
 *
 * @example
 * [5, 3, 1, -1] (negative step, inclusive end)
 * range(5, -2, -2, true);
 */
export function range(
  start: number,
  end: number,
  step = 1,
  inclusiveEnd: boolean = false
): number[] {
  if (step === 0) throw new Error("step must be non-zero");
  // Helper to build an array from a function over indices
  // For inclusiveEnd = false:
  //   if step > 0 -> [start, start+step, ..., < end]
  //   if step < 0 -> [start, start+step, ..., > end]
  // We'll compute count and then map over [0..count-1]
  if (inclusiveEnd === false) {
    if (step > 0) {
      const count = Math.max(0, Math.ceil((end - start) / step));
      return Array.from({ length: count }, (_, i) => start + i * step);
    } else {
      const count = Math.max(0, Math.ceil((start - end) / -step));
      return Array.from({ length: count }, (_, i) => start + i * step);
    }
  }

  // inclusiveEnd = true
  if (step > 0) {
    // include end if reachable: values are start, start+step, ..., end
    const count = start <= end ? Math.floor((end - start) / step) + 1 : 0;
    return Array.from({ length: count }, (_, i) => start + i * step);
  } else {
    // step < 0
    const count = start >= end ? Math.floor((start - end) / -step) + 1 : 0;
    return Array.from({ length: count }, (_, i) => start + i * step);
  }
}

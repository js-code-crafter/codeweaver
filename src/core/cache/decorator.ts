import { AsyncCache, KeyResolver } from "./basic-types";
import { createMethodDecorator } from "@/core/helpers";

/**
 * Default key resolver for memoization.
 * Takes a variable number of arguments and returns a string that uniquely identifies them.
 * For objects, it uses JSON.stringify to convert the object to a string.
 * For other types, it uses the primitive value of the argument.
 * The resulting strings are joined with "|" to form the final key.
 * @param {...args} MethodArgs
 * @returns {string}
 */
function defaultKeyResolver<MethodArgs extends any[] = any[]>(
  ...args: MethodArgs
): string {
  return args.length === 0
    ? "key"
    : args
        .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
        .join("|");
}

/**
 * Decorator that memoizes a method, using a cache of type AsyncCache<Entity>
 * and a key resolver of type KeyResolver.
 * @returns {MethodDecorator}
 */
export function Memoize<Entity, MethodArgs extends any[] = any[]>(
  cache: AsyncCache<Entity>,
  keyResolver?: KeyResolver
) {
  return createMethodDecorator<
    [AsyncCache<Entity>, KeyResolver | undefined],
    MethodArgs
  >(async ([cache, keyResolver], methodArgs, method, self) => {
    keyResolver = keyResolver ?? defaultKeyResolver;
    const key = keyResolver(...methodArgs);
    const has = await cache?.has(key);
    if (has) {
      const value = await cache?.get(key);
      return value;
    } else {
      const value = await method.apply(self, methodArgs);
      await cache?.set(key, value as Entity);
      return value;
    }
  })(cache, keyResolver);
}

/**
 * Decorator that invalidates a cache of type AsyncCache<Entity> by key.
 * @returns {MethodDecorator}
 */
export function Invalidate<Entity>(
  cache: AsyncCache<Entity>,
  shouldClearAll: boolean = true
) {
  return createMethodDecorator<
    [AsyncCache<Entity>, boolean | true],
    [string | undefined]
  >(undefined, async (_value, [cache, shouldClearAll], [key]) => {
    if (shouldClearAll === true) {
      await cache.clear();
    } else if (typeof key === "string" || typeof key === "number") {
      await cache.delete(key);
    } else {
      throw new Error("The key must be string or number.");
    }

    return null;
  })(cache, shouldClearAll);
}

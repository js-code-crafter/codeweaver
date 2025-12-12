/**
 * A simple cache interface.
 */
export interface AsyncCache<Entity> {
  set: (key: string, value: Entity) => Promise<void>;
  get: (key: string) => Promise<Entity | null>;
  delete: (key: string) => Promise<void>;
  has: (key: string) => Promise<boolean>;
  clear: () => Promise<void>;
}

/**
 * A function that takes a variable number of arguments and returns a string that uniquely identifies them.
 */
export type KeyResolver = <MethodArgs extends any[] = any[]>(
  ...args: MethodArgs
) => string;

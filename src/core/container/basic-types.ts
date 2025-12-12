export type Constructor<T = any> = new (...args: any[]) => T;

export interface Provider<T = any> {
  /** The concrete class to instantiate (may be the same as token or a different implementation). */
  useClass: Constructor<T>;
  /** Cached singleton instance, if one has been created. */
  instance?: T;
  /** Whether to treat the provider as a singleton. Defaults to true. */
  singleton?: boolean;
}

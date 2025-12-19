import "reflect-metadata";
import { Constructor, Provider } from "./basic-types";

const injectableRegistry: Array<Constructor<any>> = [];

/**
 * A tiny dependency injection container.
 *
 * Features:
 * - Register tokens (classes) with optional options.
 * - Resolve instances with automatic dependency resolution via design:paramtypes metadata.
 * - Simple singleton lifetime by default (one instance per token).
 *
 * Notes:
 * - Requires reflect-metadata to be loaded and "emitDecoratorMetadata"/"experimentalDecorators"
 *   enabled in tsconfig for design:paramtypes to exist.
 */
class Container {
  private registrations = new Map<Constructor, Provider>();

  /**
   * Register a class as a provider for the given token.
   *
   * If no options.useClass is provided, the token itself is used as the concrete class.
   * If options.singleton is not provided, the provider defaults to singleton = true.
   *
   * @param token - The token (class constructor) that represents the dependency.
   * @param options - Optional provider options.
   *   - useClass?: The concrete class to instantiate for this token.
   *   - singleton?: Whether to reuse a single instance (default: true).
   */
  public register<T>(
    token: Constructor<T>,
    options?: { useClass?: Constructor<T>; singleton?: boolean }
  ): void {
    const useClass = options?.useClass ?? token;
    const singleton = options?.singleton ?? true;
    this.registrations.set(token, { useClass, singleton });
  }

  /**
   * Resolve an instance for the given token.
   *
   * Behavior:
   * - If the token is not registered, attempt to instantiate directly (without DI).
   * - If a singleton instance already exists for the token, return it.
   * - Otherwise, resolve the concrete class (provider.useClass), construct it
   *   by recursively resolving its constructor parameter types, and cache
   *   the instance if singleton is true.
   *
   * @param token - The token (class constructor) to resolve.
   * @returns An instance of the requested type T.
   */
  public resolve<T>(token: Constructor<T>): T {
    const provider = this.registrations.get(token);

    if (!provider) {
      // If not registered, try to instantiate directly (without DI)
      return this.construct(token);
    }

    if (provider.instance) {
      return provider.instance;
    }

    // Resolve dependencies for the concrete class
    const target = provider.useClass;
    const instance = this.construct(target);

    if (provider.singleton) {
      provider.instance = instance;
    }

    return instance;
  }

  /**
   * Internal helper to instantiate a class, resolving its constructor dependencies
   * via design:paramtypes metadata.
   *
   * @param constructorFunction - The constructor function of the class to instantiate.
   * @returns A new instance of type T with dependencies injected.
   */
  private construct<T>(constructorFunction: Constructor<T>): T {
    const paramTypes: any[] =
      Reflect.getMetadata("design:paramtypes", constructorFunction) || [];
    const args = paramTypes.map((paramType) => this.resolve(paramType));
    return new constructorFunction(...args);
  }
}
/**
 * Bootstraps a container by wiring up all registered injectables.
 *
 * This helper walks the InjectableRegistry and registers each class with the container,
 * honoring per-class options (like singleton) that may have been stored as metadata.
 *
 * Why this exists:
 * - Keeps your registration centralized and automatic, so you don't have to call
 *   container.register(...) repeatedly for every service.
 *
 * Usage reminder:
 * - Ensure Reflect Metadata is loaded before calling this, so that the di:injectable
 *   metadata is actually readable.
 */
function bootstrapContainer(container: Container) {
  for (const constructorFunction of injectableRegistry) {
    // Read per-class options if you added metadata
    const meta = Reflect.getMetadata("di:injectable", constructorFunction) as
      | { singleton?: boolean }
      | undefined;
    const singleton = meta?.singleton ?? false;
    container.register(constructorFunction, { singleton });
  }
}

/**
 * Marks a class for automatic DI registration.
 * Options:
 *  - singleton: whether to register as a singleton (default true)
 *  - token: optional explicit token to register for (defaults to class constructor)
 */
export function Injectable(options?: {
  singleton?: boolean;
  token?: any;
}): ClassDecorator {
  return (target: any) => {
    // Push into registry for later registration
    injectableRegistry.push(target);
    // You could also attach metadata if you want to customize per-class
    Reflect.defineMetadata("di:injectable", options ?? {}, target);
  };
}

/** A single, shared DI container for the app. */
export const container = new Container();
bootstrapContainer(container);

/**
 * Resolve a service wherever needed.
 *
 * Example
 *
 * import { resolve } from "@/utilities/container";
 * const loggerService = resolve(LoggerService);
 * loggerService.log(...);
 */
export function resolve<T>(token: Constructor<T>): T {
  return container.resolve(token);
}

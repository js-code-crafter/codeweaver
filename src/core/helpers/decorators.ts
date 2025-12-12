import "reflect-metadata";
import { AsyncFn } from "./types";

/**
 * Factory for creating a method decorator with optional pre- and post-execution hooks.
 *
 * @template DecoratorArgs, MethodArgs
 *
 * @param before
 *   Optional hook invoked before the original method runs.
 *   - Parameters: (decoratorArgs, methodArgs, target, propertyKey, descriptor)
 *     - decoratorArgs: The arguments passed to the decorator.
 *     - methodArgs: The arguments passed to the decorated method.
 *     - target: The prototype of the class for instance methods.
 *     - propertyKey: The name of the method being decorated.
 *     - descriptor: The method's PropertyDescriptor.
 *   - Returns: Promise<boolean> indicating whether the original method should execute.
 *   - If it resolves to false, the original method will not run.
 *
 * @param after
 *   Optional hook invoked after the original method completes.
 *   - Parameters: (methodResult, decoratorArgs, methodArgs, target, propertyKey, descriptor)
 *     - methodResult: The value returned by the original method (or null if it didn't run).
 *     - decoratorArgs: The arguments passed to the decorator.
 *     - methodArgs: The arguments passed to the decorated method.
 *     - target: The prototype of the class for instance methods.
 *     - propertyKey: The name of the method being decorated.
 *     - descriptor: The method's PropertyDescriptor.
 *   - Returns: Promise<void>.
 *
 * @returns A decorator factory which, when invoked with decoratorArgs, yields a MethodDecorator.
 *
 * Notes:
 * - Be explicit about what the hooks receive and what they control.
 * - Clarify return values and behavior when before returns false.
 * - Keep terminology consistent with your codebase (hook vs. decorator vs. wrapper).
 * - If you rely on Reflect metadata, you can store metadata inside the hooks.
 *
 * Example usage:
 *
 * const Decorator = createMethodDecorator<[string], [number]>(
 *   async (decoratorArgs, methodArgs, target, propertyKey, descriptor) => { ... },           // before
 *   async (result, decoratorArgs, methodArgs, target, propertyKey, descriptor) => { ... } // after
 * );
 */
export function createMethodDecorator<
  DecoratorArgs extends any[] = any[],
  MethodArgs extends any[] = any[]
>(
  before?: (
    decoratorArgs: DecoratorArgs,
    methodArgs: MethodArgs,
    method: AsyncFn,
    rawMethodArgs: any[],
    classInstance: any,
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => Promise<any>,
  after?: (
    methodResult: any,
    decoratorArgs: DecoratorArgs,
    methodArgs: MethodArgs,
    method: AsyncFn,
    rawMethodArgs: any[],
    classInstance: any,
    target: Object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => Promise<any>
): (...decoratorArgs: DecoratorArgs) => MethodDecorator {
  return (...decoratorArgs: DecoratorArgs) => {
    return (
      target: Object,
      propertyKey: string | symbol,
      descriptor: PropertyDescriptor
    ) => {
      const originalMethod = descriptor.value as (
        ...args: any[]
      ) => Promise<any>;

      // If there is no function to wrap, bail out gracefully
      if (typeof originalMethod !== "function") {
        throw new Error("Cannot wrap non-function.");
      }

      // Wrap the original method to insert before/after hooks
      descriptor.value = async function (...methodArgs: any[]) {
        // Run the optional before hook. If not provided, default to allowing execution.
        const beforeCallbackResult =
          before != null
            ? await before(
                decoratorArgs,
                methodArgs as MethodArgs,
                originalMethod,
                methodArgs,
                this,
                target,
                propertyKey,
                descriptor
              )
            : null;

        // Execute the original method only if allowed
        const methodResult =
          beforeCallbackResult === null
            ? await originalMethod.apply(this, methodArgs)
            : beforeCallbackResult;

        // Run the optional after hook with the obtained result
        const afterCallbackResult =
          after != null
            ? await after(
                methodResult,
                decoratorArgs,
                methodArgs as MethodArgs,
                originalMethod,
                methodArgs,
                this,
                target,
                propertyKey,
                descriptor
              )
            : methodResult;

        // Return the original result (even if before denied, it's null per above)
        return afterCallbackResult === null
          ? methodResult
          : afterCallbackResult;
      };
    };
  };
}

type ParamDecoratorFactory<DecoratorArgs extends any[] = any[]> = (
  ...args: DecoratorArgs
) => ParameterDecorator;

/**
 * Factory to create a parameter decorator with optional runtime logic.
 *
 * The returned decorator can be used to attach per-parameter behavior or metadata
 * to a method parameter. The `handler` is invoked when the decorator runs, giving
 * you access to the decorator arguments, the resolved parameter type (if available),
 * the index of the decorated parameter, the target (prototype) and the method name.
 *
 * Notes:
 * - propertyKey can be string or symbol (or undefined in edge cases).
 * - If you rely on Reflect metadata, you can store metadata inside the handler.
 */
export function createParamDecorator<
  DecoratorArgs extends any[] = any[],
  MethodArgs extends any[] = any[],
  ParamType = any
>(
  handler: (
    decoratorArgs: DecoratorArgs,
    methodArgs: MethodArgs | undefined,
    parameter: ParamType | undefined,
    parameterIndex: number,
    target: Object,
    propertyKey?: string | symbol
  ) => void | Promise<void>
): ParamDecoratorFactory<DecoratorArgs> {
  // Return a factory that captures the decoratorArgs and returns a real ParameterDecorator
  return (...decoratorArgs: DecoratorArgs) => {
    return (
      target: Object,
      propertyKey: string | symbol | undefined,
      parameterIndex: number
    ) => {
      // Resolve the parameter type if available (design:paramtypes)
      let parameter: ParamType | undefined = undefined;
      let methodArgs: MethodArgs | undefined = undefined;
      if (typeof propertyKey !== "undefined" && target != null) {
        try {
          const types = Reflect.getMetadata(
            "design:paramtypes",
            target,
            propertyKey
          );
          if (Array.isArray(types) && typeof parameterIndex === "number") {
            methodArgs = types as MethodArgs;
            parameter = types[parameterIndex] as ParamType;
          }
        } catch {
          // metadata not available; swallow
        }
      }

      // Run user-supplied handler
      // Note: allow handler to be sync or async
      const maybePromise = handler(
        decoratorArgs,
        methodArgs,
        parameter,
        parameterIndex,
        target,
        propertyKey
      );

      void maybePromise;
    };
  };
}

// Hook results
type BeforeGetResult = boolean | Promise<boolean>;
type AfterGetResult = void | Promise<void>;
type BeforeSetResult = boolean | Promise<boolean>;
type AfterSetResult = void | Promise<void>;

// Common argument lists
type GetArgs<DecoratorArgs extends any[] = any[]> = {
  decoratorArgs: DecoratorArgs;
  target: Object;
  propertyKey: string | symbol;
  // current value (if you want to know what the value was before reading)
  currentValue?: any;
};

type SetArgs<DecoratorArgs extends any[] = any[]> = {
  decoratorArgs: DecoratorArgs;
  target: Object;
  propertyKey: string | symbol;
  newValue: any;
  // current value (before set)
  currentValue?: any;
};

/**
 * Factory for creating a property decorator with separate hooks for
 * get and set operations. Each hook is optional and can be composed
 * independently.
 */
export function createPropertyDecorator<
  DecoratorArgs extends any[] = any[],
  // Value type can be inferred from usage; here we keep it generic
  Value = any
>(options?: {
  beforeGet?: (ctx: GetArgs<DecoratorArgs>) => BeforeGetResult;
  afterGet?: (ctx: GetArgs<DecoratorArgs> & { value: Value }) => AfterGetResult;
  beforeSet?: (ctx: SetArgs<DecoratorArgs>) => BeforeSetResult;
  afterSet?: (ctx: SetArgs<DecoratorArgs> & { value: Value }) => AfterSetResult;
}): (...decoratorArgs: DecoratorArgs) => PropertyDecorator {
  return (...decoratorArgs: DecoratorArgs) => {
    return (target: Object, propertyKey: string | symbol) => {
      // Backing field to store the value
      const backingKey = Symbol(`__${String(propertyKey)}`);

      // Retrieve existing descriptor if any
      const descriptor = Object.getOwnPropertyDescriptor(
        target,
        propertyKey
      ) || {
        configurable: true,
        enumerable: true,
      };

      Object.defineProperty(target, propertyKey, {
        configurable: descriptor.configurable ?? true,
        enumerable: descriptor.enumerable ?? true,
        get: function (): Value {
          const currentValue = this[backingKey];
          const ctx: GetArgs<DecoratorArgs> = {
            decoratorArgs,
            target,
            propertyKey,
            currentValue,
          };

          const run = async () => {
            const allowRead = options?.beforeGet
              ? await options.beforeGet(ctx)
              : true;
            const value = allowRead ? currentValue : currentValue;
            if (options?.afterGet) {
              await options.afterGet({ ...ctx, value } as any);
            }
            return value as Value;
          };

          // Return a promise if any hook is async
          // Otherwise, return synchronously
          // Here we opt to return a Promise to keep behavior consistent with async hooks
          return run() as unknown as Value;
        },
        set: function (newValue: any) {
          const currentValue = this[propertyKey as string];
          const ctx: SetArgs<DecoratorArgs> = {
            decoratorArgs,
            target,
            propertyKey,
            newValue,
            currentValue,
          };

          const run = async () => {
            const allowWrite = options?.beforeSet
              ? await options.beforeSet(ctx)
              : true;
            if (allowWrite) {
              this[backingKey] = newValue;
            }
            if (options?.afterSet) {
              await options.afterSet({ ...ctx, value: newValue } as any);
            }
          };

          // Fire asynchronously to mirror async hooks
          void run();
        },
      });
    };
  };
}

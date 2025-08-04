import { ZodObject } from "zod";
import ZodValidator from "./validator.class";

export const ZodOutput =
  <T extends ZodObject<any, any>>(schema: T): MethodDecorator =>
  (target, propertyKey) =>
    ZodValidator.registerMethodValidationOutputSchema(
      target,
      propertyKey as string,
      schema
    );

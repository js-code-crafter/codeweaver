import { ZodUser } from "@/entities/user.entity";

/**
 * DTO for a User.
 * Derived from the full User schema.
 */
export const ZodUserDto = ZodUser;

/**
 * DTO for creating a User.
 * Derived from the full User schema by omitting the system-generated id.
 */
export const ZodUserCreationDto = ZodUser.omit({ id: true });

/**
 * Data required to create a User.
 */
export type UserCreationDto = {
  /** Username for the new user. */
  username: string;

  /** Email address for the new user. */
  email: string;

  /** Password for the new user. */
  password: string;
};

/**
 * Data for a User returned by APIs (or stored for client consumption).
 * Excludes sensitive information such as the password.
 */
export type UserDto = {
  /** Unique identifier for the user. */
  id: number;

  /** Username of the user. */
  username: string;

  /** Email address of the user. */
  email: string;
};

import { z } from "zod";

/**
 * Zod schema for User entity
 * @typedef {Object} ZodUser
 * @property {number} id - Unique identifier (min 1)
 * @property {string} username - Username (min 3 chars)
 * @property {string} email - Valid email format
 * @property {string} password - Password (min 6 chars)
 */
export const ZodUser = z.object({
  id: z.number().min(1).int(),
  username: z.string().min(3),
  email: z.email(),
  password: z.string().min(6),
});

export const ZodUserCreationDto = ZodUser.omit({ id: true });
export const ZodUserDto = ZodUser.omit({ password: true });

export type User = z.infer<typeof ZodUser>;
export type UserCreationDto = z.infer<typeof ZodUserCreationDto>;
export type UserDto = z.infer<typeof ZodUserDto>;

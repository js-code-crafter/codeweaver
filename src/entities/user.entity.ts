import z from "zod";

/**
 * Zod schema for the User entity.
 * This schema validates user data to ensure it meets basic integrity requirements
 * before being stored or processed.
 */
export const ZodUser = z.object({
  /** Unique identifier for the user. Must be a positive integer. */
  id: z.number().min(1).int(),

  /** Username chosen by the user. Minimum length of 3 characters. */
  username: z.string().min(3),

  /** Email address of the user. Must be a valid email format. */
  email: z.email(),

  /** Password for the user. Minimum length of 6 characters. */
  password: z.string().min(6),
});

/**
 * TypeScript type for a User entity.
 * Mirrors the Zod schema.
 */
export type User = {
  /** Unique identifier for the user. */
  id: number;

  /** Username chosen by the user. */
  username: string;

  /** Email address of the user. */
  email: string;

  /** Password for the user. */
  password: string;
};

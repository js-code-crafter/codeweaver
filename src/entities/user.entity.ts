import z from "zod";

/**
 * Zod schema for User entity
 */
export const ZodUser = z.object({
  id: z.number().min(1).int(),
  username: z.string().min(3),
  email: z.email(),
  password: z.string().min(6),
});

export type User = {
  id: number;
  username: string;
  email: string;
  password: string;
};

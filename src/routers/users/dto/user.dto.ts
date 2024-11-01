import { z } from "zod";

export const CreateUserDto = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

export type CreateUser = z.infer<typeof CreateUserDto>;

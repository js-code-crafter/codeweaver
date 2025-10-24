import { ZodUser } from "@/entities/user.entity";
import z from "zod";

export const ZodUserCreationDto = ZodUser.omit({ id: true });
export const ZodUserDto = ZodUser.omit({ password: true });

export type UserCreationDto = {
  username: string;
  email: string;
  password: string;
};

export type UserDto = {
  id: number;
  username: string;
  email: string;
};

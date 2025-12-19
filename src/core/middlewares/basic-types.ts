import { Request, Response, NextFunction } from "express";

/**
 * Extend Express Request to optionally include a user payload.
 * This allows downstream middleware and handlers to access authenticated user data.
 */
export interface UserRequest<UserIdType = string | number> extends Request {
  /** Authenticated user payload parsed from the JWT. */
  user?: UserPayload<UserIdType>;
}

export type RouterFn<UserIdType = string | number> = (
  req: UserRequest<UserIdType>,
  res: Response,
  next: NextFunction
) => void;

/**
 * User payload attached to the request after successful authentication.
 * Extends JwtPayload with a flexible key-value store.
 */
export type UserPayload<UserIdType = string | number> = {
  id?: UserIdType;
} & Record<string, any>;

/**
 * Options for the authenticateToken middleware.
 * - audience: Optional JWT audience claim to validate against.
 * - issuer: Optional JWT issuer claim to validate against.
 * - maxAge: Optional maximum age for the token (e.g., "1h", "15m").
 */
export type JwtOptions = {
  /** Valid audience for the JWT. */
  audience?: string;
  /** Valid issuer for the JWT. */
  issuer?: string;
  /** Maximum allowed age for the JWT (e.g., "1h"). */
  maxAge?: string;
};

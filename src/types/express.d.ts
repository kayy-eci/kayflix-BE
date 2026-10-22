import type { JwtPayload } from "jsonwebtoken";

export type UserRole = "user" | "admin";

export interface UserTokenPayload extends JwtPayload {
  id: number;
  email: string;
  role?: UserRole;
  jti?: string;
}

declare global {
  namespace Express {
    interface Locals {
      user?: UserTokenPayload;
    }
  }
}

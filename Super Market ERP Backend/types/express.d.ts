import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        UserID: number;
        id?: number;
        Username: string;
        username?: string;
        UserRole: string;
        role?: string;
        isMasterAdmin?: boolean;
      };
      validated?: Record<string, unknown>;
    }
  }
}

export {};

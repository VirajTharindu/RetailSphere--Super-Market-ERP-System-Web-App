import { Request, Response, NextFunction } from "express";

/**
 * Role-Based Access Control middleware
 * @param  {...string} allowedRoles
 */
const rbacMiddleware = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.UserRole) {
      return res.status(403).json({
        error: "Access denied. Role information missing.",
      });
    }

    const userRole = req.user.UserRole;

    if (!allowedRoles.// @ts-ignore
// @ts-ignore
includes(userRole)) {
      return res.status(403).json({
        error: "Access denied. Insufficient permissions.",
      });
    }

    next();
  };
};

export default rbacMiddleware;

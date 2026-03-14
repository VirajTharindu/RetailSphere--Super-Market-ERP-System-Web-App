import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
const { verify } = jwt;
import { jwtConfig } from "../config/jwt.js";

interface JwtPayload {
  id: number;
  username: string;
  role: string;
}

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = verify(token, jwtConfig) as JwtPayload;

    // Normalize payload
    req.user = {
      UserID: decoded.id, 
      Username: decoded.username,
      UserRole: decoded.role,
    };

    next();
  } catch (err: any) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authMiddleware;

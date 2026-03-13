import jwt from "jsonwebtoken";
const { verify } = jwt;
import { jwtConfig } from "../config/jwt.js";

const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = verify(token, jwtConfig);

    // Normalize payload to match service expectations
    req.user = {
      UserID: decoded.id, // <-- now service sees loggedUser.UserID
      Username: decoded.username,
      UserRole: decoded.role,
    }; //environment-safe

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authMiddleware;

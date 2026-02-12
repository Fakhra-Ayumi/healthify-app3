//Verification middleware to protect routes and identify the logged-in user via JWT
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_temporary_secret_key";

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer token

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET) as any;
    req.user = verified;
    console.log("✓ Auth Success - User ID:", verified.userId);
    next();
  } catch (error) {
    console.error("✗ Auth Failed:", error);
    res.status(403).json({ message: "Invalid token." });
  }
};

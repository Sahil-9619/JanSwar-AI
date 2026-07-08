import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../index";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_dev";

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access Denied: No Token Provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: Role };

    if (!decoded || !decoded.id) {
      return res.status(403).json({ error: "Access Denied: Invalid Token Payload" });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(403).json({ error: "Access Denied: User not found" });
    }

    // Attach user information to request object
    req.user = {
      id: user.id,
      phoneNumber: user.phoneNumber || "",
      fullName: user.fullName,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error("JWT Verification failed:", error);
    return res.status(403).json({ error: "Access Denied: Invalid or Expired Token" });
  }
}

export function requireRoles(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Access Denied: User Unauthenticated" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: "Access Denied: Insufficient permissions", 
        message: `Required role(s): ${allowedRoles.join(", ")}, current: ${req.user.role}` 
      });
    }

    next();
  };
}

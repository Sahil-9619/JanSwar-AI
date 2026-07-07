import { clerkClient } from "@clerk/clerk-sdk-node";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../index";
import { Role } from "@prisma/client";

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format: Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Access Denied: No Token Provided" });
  }

  try {
    // Verify token using Clerk SDK
    const decoded = await clerkClient.verifyToken(token);
    const clerkId = decoded.sub;

    if (!clerkId) {
      return res.status(403).json({ error: "Access Denied: Invalid Clerk Session" });
    }

    // Check if user exists in PostgreSQL
    let user = await prisma.user.findUnique({
      where: { clerkId },
    });

    // Lazy sync: if user does not exist in local database, fetch from Clerk and insert
    if (!user) {
      console.log(`[Clerk Auth Sync] Syncing new user from Clerk: ${clerkId}`);
      try {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        
        // Extract details
        const email = clerkUser.emailAddresses[0]?.emailAddress || null;
        const phoneNumber = clerkUser.phoneNumbers[0]?.phoneNumber || null;
        const fullName = 
          clerkUser.fullName || 
          `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || 
          clerkUser.username || 
          "Clerk User";
          
        // Read role from Clerk metadata if present, fallback to CITIZEN
        const metadataRole = clerkUser.publicMetadata?.role as Role;
        const role = Object.values(Role).includes(metadataRole) ? metadataRole : Role.CITIZEN;

        user = await prisma.user.create({
          data: {
            clerkId,
            fullName,
            email,
            phoneNumber,
            role,
          },
        });

        // Audit Log
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "CLERK_USER_SYNCED",
            details: `Profile lazy-synced from Clerk. Role assigned: ${role}`,
          },
        });
      } catch (syncError: any) {
        console.error("[Clerk Auth Sync Error] Failed to fetch profile:", syncError.message);
        return res.status(500).json({ error: "Internal Server Error during user synchronization" });
      }
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
    console.error("Clerk JWT Verification failed:", error);
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

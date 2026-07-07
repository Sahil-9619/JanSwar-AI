import { clerkClient } from "@clerk/clerk-sdk-node";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../index";
import { Role } from "@prisma/client";
import { getRoleAssignment } from "../config/roleAssignments";

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

    const clerkUser = await clerkClient.users.getUser(clerkId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || null;
    const phoneNumber = clerkUser.phoneNumbers[0]?.phoneNumber || null;
    const fullName =
      clerkUser.fullName ||
      `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      clerkUser.username ||
      "Clerk User";
    const roleAssignment = getRoleAssignment(email);
    const metadataRole = clerkUser.publicMetadata?.role as Role;
    const metadataRoleIsValid = Object.values(Role).includes(metadataRole);
    const resolvedRole = roleAssignment?.role || (metadataRoleIsValid ? metadataRole : Role.CITIZEN);

    // Lazy sync: if user does not exist in local database, fetch from Clerk and insert
    if (!user) {
      console.log(`[Clerk Auth Sync] Syncing new user from Clerk: ${clerkId}`);
      try {
        user = await prisma.user.create({
          data: {
            clerkId,
            fullName: roleAssignment?.name || fullName,
            email,
            phoneNumber,
            role: resolvedRole,
          },
        });

        // Audit Log
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: "CLERK_USER_SYNCED",
            details: `Profile lazy-synced from Clerk. Role assigned: ${resolvedRole}`,
          },
        });
      } catch (syncError: any) {
        console.error("[Clerk Auth Sync Error] Failed to fetch profile:", syncError.message);
        return res.status(500).json({ error: "Internal Server Error during user synchronization" });
      }
    } else if (user.role !== resolvedRole) {
      const previousRole = user.role;
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: resolvedRole,
          fullName: roleAssignment?.name || user.fullName,
          email: email || user.email,
          phoneNumber: phoneNumber || user.phoneNumber,
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_ROLE_UPDATED",
          details: `Role updated from ${previousRole} to ${resolvedRole} using Clerk metadata or roleAssignments.json`,
        },
      });
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

import { Request, Response } from "express";
import { prisma } from "../index";

// ME PROFILE CONTROLLER
// Retrieves profile details from PostgreSQL database matching the authenticated Clerk user
export async function me(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!userProfile) {
      return res.status(404).json({ error: "User profile not found in local database" });
    }

    res.status(200).json({ user: userProfile });
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({ error: "Internal Server Error fetching user profile" });
  }
}

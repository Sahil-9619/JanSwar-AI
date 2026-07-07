import { Router, Request, Response } from "express";
import { prisma } from "../index";
import { authenticateToken, requireRoles } from "../middleware/auth";
import { Role } from "@prisma/client";

const router = Router();

// GET /api/audit
// Retrieves all audit logs (Admin only)
router.get("/", authenticateToken, requireRoles([Role.DISTRICT_ADMIN, Role.SUPER_ADMIN]), async (req: Request, res: Response) => {
  try {
    const auditLogs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 100, // Limit to recent 100 entries for display performance
    });

    res.status(200).json({ auditLogs });
  } catch (error: any) {
    console.error("Get Audit Logs Error:", error);
    res.status(500).json({ error: "Internal Server Error fetching system audit logs" });
  }
});

export default router;

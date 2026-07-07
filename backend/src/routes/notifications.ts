import { Router, Request, Response } from "express";
import { prisma } from "../index";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// GET /api/notifications
// Retrieves notifications for the logged-in user
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user!.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({ notifications });
  } catch (error: any) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ error: "Internal Server Error fetching notifications" });
  }
});

// PATCH /api/notifications/:id/read
// Marks a specific notification as read
router.patch("/:id/read", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found or access denied" });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.status(200).json({ notification: updatedNotification });
  } catch (error: any) {
    console.error("Read Notification Error:", error);
    res.status(500).json({ error: "Internal Server Error marking notification read" });
  }
});

// PATCH /api/notifications/read-all
// Marks all notifications of user as read
router.patch("/read-all", authenticateToken, async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error: any) {
    console.error("Read All Notifications Error:", error);
    res.status(500).json({ error: "Internal Server Error marking all notifications read" });
  }
});

export default router;

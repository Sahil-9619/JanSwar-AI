import { Router, Request, Response, NextFunction } from "express";
import { createSuggestion, getSuggestions, getSuggestionById, updateSuggestionAI } from "../controllers/suggestionController";
import { authenticateToken } from "../middleware/auth";
import { upload, handleUploadError } from "../middleware/upload";

const router = Router();

// Upload multiple optional files: voice suggestion (audio), site photo (image), supporting doc (document)
const suggestionUpload = upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "image", maxCount: 1 },
  { name: "document", maxCount: 1 },
]);

// Internal microservice authorization middleware
function verifyInternalSecret(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers["x-internal-secret"];
  const expectedSecret = process.env.INTERNAL_API_SECRET || "jan_swar_ai_secret_internal_microservice_communication_key_2026";
  if (!secret || secret !== expectedSecret) {
    return res.status(403).json({ error: "Access Denied: Invalid internal service signature" });
  }
  next();
}

import { prisma } from "../index";

router.post("/", authenticateToken, suggestionUpload, handleUploadError, createSuggestion);
router.get("/", authenticateToken, getSuggestions);
router.get("/:id", authenticateToken, getSuggestionById);
router.patch("/:id/ai-complete", verifyInternalSecret, updateSuggestionAI);

// Allow MP / Admin to update suggestion status
router.patch("/:id/status", authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["PENDING", "PROCESSING", "ANALYZED", "APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status update. Must be PENDING, PROCESSING, ANALYZED, APPROVED, or REJECTED." });
  }

  try {
    const updatedSuggestion = await prisma.suggestion.update({
      where: { id },
      data: { status: status as any }
    });

    res.status(200).json({ suggestion: updatedSuggestion });
  } catch (err) {
    console.error("Failed to update suggestion status:", err);
    res.status(500).json({ error: "Failed to update suggestion status" });
  }
});

export default router;

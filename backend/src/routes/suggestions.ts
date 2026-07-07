import { Router } from "express";
import { createSuggestion, getSuggestions, getSuggestionById } from "../controllers/suggestionController";
import { authenticateToken } from "../middleware/auth";
import { upload, handleUploadError } from "../middleware/upload";

const router = Router();

// Upload multiple optional files: voice suggestion (audio), site photo (image), supporting doc (document)
const suggestionUpload = upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "image", maxCount: 1 },
  { name: "document", maxCount: 1 },
]);

router.post("/", authenticateToken, suggestionUpload, handleUploadError, createSuggestion);
router.get("/", authenticateToken, getSuggestions);
router.get("/:id", authenticateToken, getSuggestionById);

export default router;

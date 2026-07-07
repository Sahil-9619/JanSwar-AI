import { Router } from "express";
import { me } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/me", authenticateToken, me);

export default router;

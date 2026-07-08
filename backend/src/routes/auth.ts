import { Router } from "express";
import { me, requestOtp, verifyOtp } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.get("/me", authenticateToken, me);

export default router;

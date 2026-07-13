import { Router } from "express";
import { me, requestOtp, verifyOtp, signup, verifySignup, login, resendOtp, requestPasswordReset, verifyPasswordReset } from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.post("/signup", signup);
router.post("/verify-signup", verifySignup);
router.post("/login", login);
router.post("/resend-otp", resendOtp);
router.post("/request-password-reset", requestPasswordReset);
router.post("/verify-password-reset", verifyPasswordReset);
router.get("/me", authenticateToken, me);

export default router;

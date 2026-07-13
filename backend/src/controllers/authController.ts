import { Request, Response } from "express";
import { prisma } from "../index";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import bcrypt from "bcrypt";
import { sendOtpEmail } from "../services/emailService";

const otpStore = new Map<string, { 
  otp: string; 
  expiresAt: number; 
  role?: Role; 
  fullName?: string; 
  passwordHash?: string; 
  city?: string; 
  state?: string; 
}>();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key_for_dev";

export async function requestOtp(req: Request, res: Response) {
  const { email, role, fullName } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Generate 6 digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins

  otpStore.set(email, { otp, expiresAt, role, fullName });

  console.log(`\n\n==========================`);
  console.log(`[DEVELOPMENT] OTP for ${email}: ${otp}`);
  console.log(`==========================\n\n`);

  try {
    await sendOtpEmail(email, otp, "login");
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP via email:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
}

export async function verifyOtp(req: Request, res: Response) {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const record = otpStore.get(email);
  if (!record) {
    return res.status(400).json({ error: "No OTP requested for this email" });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: "OTP has expired" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  otpStore.delete(email);

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create user if not exists using provided role/fullName or defaults
      user = await prisma.user.create({
        data: {
          email,
          fullName: record.fullName || email.split("@")[0],
          role: record.role || Role.CITIZEN,
        },
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token, user });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
}

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

export async function signup(req: Request, res: Response) {
  const { fullName, email, password, city, state, role } = req.body;
  if (!email || !password || !fullName || !city || !state) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000;

    otpStore.set(email, { 
      otp, 
      expiresAt, 
      role: role || Role.CITIZEN, 
      fullName, 
      passwordHash, 
      city, 
      state 
    });

    console.log(`\n\n==========================`);
    console.log(`[DEVELOPMENT] SIGNUP OTP for ${email}: ${otp}`);
    console.log(`==========================\n\n`);

    await sendOtpEmail(email, otp, "signup");
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Signup request error:", error);
    res.status(500).json({ error: "Failed to process signup request" });
  }
}

export async function verifySignup(req: Request, res: Response) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  const record = otpStore.get(email);
  if (!record) {
    return res.status(400).json({ error: "No signup session found for this email" });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: "OTP has expired" });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  otpStore.delete(email);

  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    user = await prisma.user.create({
      data: {
        email,
        fullName: record.fullName || email.split("@")[0],
        passwordHash: record.passwordHash,
        city: record.city,
        state: record.state,
        role: record.role || Role.CITIZEN,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token, user });
  } catch (error) {
    console.error("Verify signup error:", error);
    res.status(500).json({ error: "Failed to verify signup and create user" });
  }
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ error: "This account does not have a password configured. Please use OTP login." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token, user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to log in" });
  }
}

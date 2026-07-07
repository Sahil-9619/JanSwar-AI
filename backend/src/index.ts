import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";
import authRouter from "./routes/auth";
import suggestionsRouter from "./routes/suggestions";
import categoriesRouter from "./routes/categories";
import locationsRouter from "./routes/locations";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

export const prisma = new PrismaClient();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: "*", // Configure as needed for production
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", limiter);

// Log requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/suggestions", suggestionsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/locations", locationsRouter);

// Health check API
app.get("/api/health", async (req: Request, res: Response) => {
  try {
    // Basic Prisma DB check
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error: any) {
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
    });
  }
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// Start Server
app.listen(port, () => {
  console.log(`[JanSwar AI Backend] Gateway running on port ${port}`);
});

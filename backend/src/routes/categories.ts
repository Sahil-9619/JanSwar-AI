import { Router } from "express";
import { prisma } from "../index";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    res.status(200).json({ categories });
  } catch (error) {
    console.error("Fetch Categories Error:", error);
    res.status(500).json({ error: "Internal Server Error fetching categories" });
  }
});

export default router;

import { Router } from "express";
import { prisma } from "../index";

const router = Router();

// Get all districts
router.get("/districts", async (req, res) => {
  try {
    const districts = await prisma.district.findMany({
      orderBy: { name: "asc" },
    });
    res.status(200).json({ districts });
  } catch (error) {
    console.error("Fetch Districts Error:", error);
    res.status(500).json({ error: "Internal Server Error fetching districts" });
  }
});

// Get blocks by district ID
router.get("/districts/:districtId/blocks", async (req, res) => {
  try {
    const { districtId } = req.params;
    const blocks = await prisma.block.findMany({
      where: { districtId },
      orderBy: { name: "asc" },
    });
    res.status(200).json({ blocks });
  } catch (error) {
    console.error("Fetch Blocks Error:", error);
    res.status(500).json({ error: "Internal Server Error fetching blocks" });
  }
});

// Get villages by block ID
router.get("/blocks/:blockId/villages", async (req, res) => {
  try {
    const { blockId } = req.params;
    const villages = await prisma.village.findMany({
      where: { blockId },
      orderBy: { name: "asc" },
    });
    res.status(200).json({ villages });
  } catch (error) {
    console.error("Fetch Villages Error:", error);
    res.status(500).json({ error: "Internal Server Error fetching villages" });
  }
});

export default router;

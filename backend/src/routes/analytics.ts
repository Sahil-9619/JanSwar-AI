import { Router, Request, Response } from "express";
import { prisma } from "../index";
import { authenticateToken } from "../middleware/auth";
import { SuggestionStatus } from "@prisma/client";

const router = Router();

// GET /api/analytics/metrics
// Returns summary cards metadata: total, pending, approved, resolved, and avg priority
router.get("/metrics", authenticateToken, async (req: Request, res: Response) => {
  try {
    const statuses = Object.values(SuggestionStatus);
    
    // Count suggestions by status
    const suggestionCounts = await prisma.suggestion.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    });

    // Structure output
    const countsMap: Record<string, number> = {
      TOTAL: 0,
    };
    statuses.forEach((s) => {
      countsMap[s] = 0;
    });

    let total = 0;
    suggestionCounts.forEach((group) => {
      countsMap[group.status] = group._count.id;
      total += group._count.id;
    });
    countsMap.TOTAL = total;

    // Calculate average priority score
    const avgPriorityResult = await prisma.priorityScore.aggregate({
      _avg: {
        finalScore: true,
      },
    });

    res.status(200).json({
      total: countsMap.TOTAL,
      pending: countsMap.PENDING + countsMap.PROCESSING,
      analyzed: countsMap.ANALYZED,
      approved: countsMap.APPROVED,
      archived: countsMap.REJECTED,
      avgPriorityScore: avgPriorityResult._avg.finalScore || 0,
    });
  } catch (error: any) {
    console.error("Get Analytics Metrics Error:", error);
    res.status(500).json({ error: "Internal Server Error fetching analytics metrics" });
  }
});

// GET /api/analytics/categories
// Returns suggestion distributions grouped by category name
router.get("/categories", authenticateToken, async (req: Request, res: Response) => {
  try {
    const categoriesWithCounts = await prisma.category.findMany({
      include: {
        _count: {
          select: { suggestions: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const formattedData = categoriesWithCounts.map((cat) => ({
      category: cat.name,
      count: cat._count.suggestions,
      description: cat.description,
    }));

    res.status(200).json({ categories: formattedData });
  } catch (error: any) {
    console.error("Get Analytics Categories Error:", error);
    res.status(500).json({ error: "Internal Server Error fetching category distribution" });
  }
});

// GET /api/analytics/locations
// Returns block-level aggregated statistics
router.get("/locations", authenticateToken, async (req: Request, res: Response) => {
  try {
    const blocks = await prisma.block.findMany({
      include: {
        suggestions: {
          include: {
            priorityScore: true,
          },
        },
        villages: {
          select: {
            infrastructureGap: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const blockData = blocks.map((block) => {
      const suggestionsCount = block.suggestions.length;
      
      // Calculate average priority score for suggestions in this block
      const scoredSuggestions = block.suggestions.filter(s => s.priorityScore !== null);
      const avgPriority = scoredSuggestions.length > 0
        ? scoredSuggestions.reduce((acc, curr) => acc + (curr.priorityScore?.finalScore || 0), 0) / scoredSuggestions.length
        : 0;

      // Calculate average infrastructure gap for villages in this block
      const villageGaps = block.villages.map(v => v.infrastructureGap);
      const avgInfraGap = villageGaps.length > 0
        ? villageGaps.reduce((acc, curr) => acc + curr, 0) / villageGaps.length
        : 0;

      return {
        blockId: block.id,
        blockName: block.name,
        suggestionsCount,
        avgPriorityScore: parseFloat(avgPriority.toFixed(1)),
        avgInfrastructureGap: parseFloat(avgInfraGap.toFixed(2)),
      };
    });

    // Also get all geolocations for mapping suggestions
    const suggestionPoints = await prisma.suggestion.findMany({
      where: {
        latitude: { not: 0 },
        longitude: { not: 0 },
      },
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
        status: true,
        createdAt: true,
        priorityScore: {
          select: {
            finalScore: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
        village: {
          select: {
            name: true,
          },
        },
        block: {
          select: {
            name: true,
          },
        },
      },
    });

    res.status(200).json({ 
      blocks: blockData, 
      points: suggestionPoints 
    });
  } catch (error: any) {
    console.error("Get Analytics Locations Error:", error);
    res.status(500).json({ error: "Internal Server Error fetching geographic location analytics" });
  }
});

export default router;

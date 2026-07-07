import { Router, Request, Response } from "express";
import { prisma } from "../index";
import { authenticateToken, requireRoles } from "../middleware/auth";
import { Role } from "@prisma/client";

const router = Router();

// GET /api/recommendations
// Lists recommendations. Auto-populates mock recommendations if database is empty.
router.get("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    let recommendations = await prisma.recommendation.findMany({
      include: {
        category: true,
        district: true,
        block: true,
        village: true,
      },
      orderBy: {
        priorityScore: "desc",
      },
    });

    // Auto-generate recommendations if none exist
    if (recommendations.length === 0) {
      console.log("[Recommendations Ingestion] Table empty. Auto-generating gap-based recommendations...");
      
      const categories = await prisma.category.findMany();
      const villages = await prisma.village.findMany({
        include: {
          block: {
            include: {
              district: true,
            },
          },
          infrastructureInfo: true,
        },
      });

      const roadCat = categories.find(c => c.name === "Road");
      const healthCat = categories.find(c => c.name === "Healthcare");
      const waterCat = categories.find(c => c.name === "Water");
      const eduCat = categories.find(c => c.name === "Education");

      // We look at villages with highest gaps
      const generatedRecs = [];

      for (const village of villages) {
        const block = village.block;
        const district = block.district;
        const infra = village.infrastructureInfo;

        if (!infra) continue;

        // 1. Health Gap Rec
        if (infra.healthAccess < 0.3 && healthCat) {
          const rec = await prisma.recommendation.create({
            data: {
              title: `Primary Health Center Clinic - ${village.name}`,
              description: `Construct a community health clinic in ${village.name} (${block.name} block). Current health access rating is critical at ${(infra.healthAccess * 10).toFixed(1)}/10. This project will serve a population of ${village.population} citizens and bridge a ${Math.round(village.infrastructureGap * 100)}% overall block gap.`,
              priorityScore: parseFloat((village.infrastructureGap * 60 + (1 - infra.healthAccess) * 40).toFixed(1)),
              categoryId: healthCat.id,
              districtId: district.id,
              blockId: block.id,
              villageId: village.id,
              status: "PENDING",
            },
          });
          generatedRecs.push(rec);
        }

        // 2. Road Gap Rec
        if (infra.roadQuality < 0.4 && roadCat) {
          const rec = await prisma.recommendation.create({
            data: {
              title: `Tarmac Paving & Bridge Connection - ${village.name}`,
              description: `Pave the primary entry road in ${village.name} (${block.name} block). Current road quality score is ${(infra.roadQuality * 10).toFixed(1)}/10 with high transport isolation. Required for freight and citizen school commutes.`,
              priorityScore: parseFloat((village.infrastructureGap * 50 + (1 - infra.roadQuality) * 50).toFixed(1)),
              categoryId: roadCat.id,
              districtId: district.id,
              blockId: block.id,
              villageId: village.id,
              status: "PENDING",
            },
          });
          generatedRecs.push(rec);
        }

        // 3. Water access Rec
        if (infra.waterAccess < 0.4 && waterCat) {
          const rec = await prisma.recommendation.create({
            data: {
              title: `Deep Bore Wells & Drinking Water Pipes - ${village.name}`,
              description: `Extend the water supply pipeline and dig three community deep-bore tube wells in ${village.name}. Drinking water accessibility is currently rated ${(infra.waterAccess * 10).toFixed(1)}/10, causing sanitation problems.`,
              priorityScore: parseFloat((village.infrastructureGap * 55 + (1 - infra.waterAccess) * 45).toFixed(1)),
              categoryId: waterCat.id,
              districtId: district.id,
              blockId: block.id,
              villageId: village.id,
              status: "PENDING",
            },
          });
          generatedRecs.push(rec);
        }

        // 4. Education access Rec
        if (infra.educationAccess < 0.3 && eduCat) {
          const rec = await prisma.recommendation.create({
            data: {
              title: `Primary School Upgrade & Teacher Recruitment - ${village.name}`,
              description: `Reconstruct the secondary classrooms and allocate permanent teachers to ${village.name}. Current education access index is ${(infra.educationAccess * 10).toFixed(1)}/10 with high student dropout rates.`,
              priorityScore: parseFloat((village.infrastructureGap * 45 + (1 - infra.educationAccess) * 55).toFixed(1)),
              categoryId: eduCat.id,
              districtId: district.id,
              blockId: block.id,
              villageId: village.id,
              status: "PENDING",
            },
          });
          generatedRecs.push(rec);
        }
      }

      // Re-fetch with relations
      recommendations = await prisma.recommendation.findMany({
        include: {
          category: true,
          district: true,
          block: true,
          village: true,
        },
        orderBy: {
          priorityScore: "desc",
        },
      });
    }

    res.status(200).json({ recommendations });
  } catch (error: any) {
    console.error("Get Recommendations Error:", error);
    res.status(500).json({ error: "Internal Server Error fetching recommendations" });
  }
});

// PATCH /api/recommendations/:id
// Updates status of recommendation (PENDING, APPROVED, COMPLETED)
router.patch("/:id", authenticateToken, requireRoles([Role.MP, Role.DISTRICT_ADMIN, Role.SUPER_ADMIN]), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["PENDING", "APPROVED", "COMPLETED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status update. Must be PENDING, APPROVED, or COMPLETED." });
  }

  try {
    const originalRec = await prisma.recommendation.findUnique({
      where: { id },
      include: {
        category: true,
        village: true,
      },
    });

    if (!originalRec) {
      return res.status(404).json({ error: "Recommendation not found" });
    }

    const updatedRec = await prisma.recommendation.update({
      where: { id },
      data: { status },
      include: {
        category: true,
        district: true,
        block: true,
        village: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: `RECOMMENDATION_STATUS_UPDATED`,
        details: `Recommendation "${updatedRec.title}" status changed from ${originalRec.status} to ${status} by user ${req.user!.fullName}`,
      },
    });

    // Trigger automatic Citizen Notifications if project is marked COMPLETED
    if (status === "COMPLETED") {
      console.log(`[Citizen Notification Trigger] Project completed: "${updatedRec.title}". Finding related suggestions...`);
      
      // Find all citizens who submitted suggestions in the same category & village
      const citizensWithSuggestions = await prisma.suggestion.findMany({
        where: {
          villageId: updatedRec.villageId,
          categoryId: updatedRec.categoryId,
        },
        select: {
          userId: true,
          title: true,
        },
      });

      // Deduplicate user IDs to avoid double notifying
      const uniqueUserIds = Array.from(new Set(citizensWithSuggestions.map(s => s.userId)));

      // Create notifications
      const notificationsData = uniqueUserIds.map(userId => ({
        userId,
        title: "Development Project Completed!",
        message: `Great news! The planned infrastructure project "${updatedRec.title}" has been completed in your village. Thank you for raising your voice on JanSwar AI.`,
      }));

      if (notificationsData.length > 0) {
        await prisma.notification.createMany({
          data: notificationsData,
        });
        console.log(`[Citizen Notification Trigger] Created ${notificationsData.length} notifications.`);
      }
    }

    res.status(200).json({ 
      message: `Recommendation updated successfully.`,
      recommendation: updatedRec 
    });
  } catch (error: any) {
    console.error("Update Recommendation Error:", error);
    res.status(500).json({ error: "Internal Server Error updating recommendation status" });
  }
});

// POST /api/recommendations
// Manually create a recommendation (Admin only)
router.post("/", authenticateToken, requireRoles([Role.DISTRICT_ADMIN, Role.SUPER_ADMIN]), async (req: Request, res: Response) => {
  const { title, description, priorityScore, categoryId, districtId, blockId, villageId } = req.body;

  if (!title || !description || !categoryId) {
    return res.status(400).json({ error: "Title, description, and categoryId are required fields." });
  }

  try {
    const newRec = await prisma.recommendation.create({
      data: {
        title,
        description,
        priorityScore: priorityScore ? parseFloat(priorityScore) : 50.0,
        categoryId,
        districtId: districtId || null,
        blockId: blockId || null,
        villageId: villageId || null,
        status: "PENDING",
      },
      include: {
        category: true,
        district: true,
        block: true,
        village: true,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: "RECOMMENDATION_CREATED_MANUALLY",
        details: `Recommendation "${newRec.title}" manually registered for village "${newRec.village?.name || 'Constituency'}"`,
      },
    });

    res.status(201).json({ recommendation: newRec });
  } catch (error: any) {
    console.error("Create Recommendation Error:", error);
    res.status(500).json({ error: "Internal Server Error registering recommendation" });
  }
});

// POST /api/recommendations/cluster
// Triggers the FastAPI spatial-semantic clustering pipeline and imports results as Recommendations
router.post("/cluster", authenticateToken, requireRoles([Role.MP, Role.DISTRICT_ADMIN, Role.SUPER_ADMIN]), async (req: Request, res: Response) => {
  try {
    const axios = (await import("axios")).default;
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8000";

    // 1. Fetch suggestions with category and village info
    const suggestions = await prisma.suggestion.findMany({
      where: {
        status: {
          not: "REJECTED"
        }
      },
      include: {
        category: true,
        village: {
          include: {
            block: true
          }
        },
        priorityScore: true
      }
    });

    if (suggestions.length === 0) {
      return res.status(200).json({ message: "No active suggestions found to cluster.", recommendations: [] });
    }

    // 2. Map payload for the AI microservice
    const suggestionsPayload = suggestions.map(s => ({
      id: s.id,
      title: s.title,
      description: s.description || s.transcription || s.translatedText || "",
      latitude: s.latitude,
      longitude: s.longitude,
      priorityScore: s.priorityScore?.finalScore || 50.0,
      categoryId: s.categoryId || "",
      categoryName: s.category?.name || "General",
      districtId: s.village?.block?.districtId || "",
      blockId: s.blockId || "",
      villageId: s.villageId || "",
      blockName: s.village?.block?.name || "Block",
      villageName: s.village?.name || "Village"
    }));

    // 3. Fire request to Python AI Service
    console.log(`[AI Clustering] Sending ${suggestionsPayload.length} suggestions to cluster engine...`);
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/ai/cluster`, {
      suggestions: suggestionsPayload,
      eps: 0.5,
      minSamples: 2,
      semanticWeight: 3.0
    });

    const proposedProjects = aiResponse.data.proposedProjects || [];
    console.log(`[AI Clustering] Microservice returned ${proposedProjects.length} projects.`);

    // 4. Save new projects into Recommendation database
    if (proposedProjects.length > 0) {
      // Clear existing PENDING recommendations to avoid duplication
      await prisma.recommendation.deleteMany({
        where: {
          status: "PENDING"
        }
      });

      // Insert new clustered proposals
      for (const project of proposedProjects) {
        await prisma.recommendation.create({
          data: {
            title: project.title,
            description: project.description,
            priorityScore: project.priorityScore,
            categoryId: project.categoryId,
            districtId: project.districtId,
            blockId: project.blockId,
            villageId: project.villageId,
            status: "PENDING"
          }
        });
      }

      // Log action
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: "AI_CLUSTERING_RUN",
          details: `AI Spatial-Semantic clustering executed. Generated ${proposedProjects.length} planning proposals from raw grievances.`
        }
      });
    }

    // 5. Fetch and return updated list
    const updatedRecommendations = await prisma.recommendation.findMany({
      include: {
        category: true,
        district: true,
        block: true,
        village: true
      },
      orderBy: {
        priorityScore: "desc"
      }
    });

    res.status(200).json({ 
      message: `AI clustering complete. Generated ${proposedProjects.length} proposals.`,
      recommendations: updatedRecommendations 
    });

  } catch (error: any) {
    console.error("Run AI Clustering Error:", error.message);
    res.status(500).json({ error: "Failed to run AI spatial-semantic clustering pipeline" });
  }
});

export default router;

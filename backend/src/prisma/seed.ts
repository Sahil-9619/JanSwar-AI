import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Database seeding started...");

  // 1. Seed Categories
  const categories = [
    { name: "Road", description: "Highway repair, local street paving, bridge maintenance, and drainage" },
    { name: "Water", description: "Clean drinking water access, tube wells, supply pipelines, and rain harvesting" },
    { name: "Healthcare", description: "Community health centers, medicine supply, doctors availability, and ambulances" },
    { name: "Education", description: "School buildings, smart classrooms, teachers recruitment, and learning materials" },
    { name: "Electricity", description: "Power grid extension, transformers, solar street lights, and load shedding fixes" },
    { name: "Employment", description: "Skill development centers, local cottage industries, and job fairs" },
    { name: "Agriculture", description: "Irrigation channels, cold storage facilities, subsidies, and seeds distribution" },
    { name: "Transport", description: "Public bus routes, railway connectivity, and bus stands" },
    { name: "Sanitation", description: "Public toilets, sewage treatment, waste collection, and drain cleaning" },
    { name: "Digital Infrastructure", description: "Common Service Centers, Wi-Fi hotspots, and optical fiber broadband" },
    { name: "Environment", description: "Aforestation, river cleaning, solar energy, and air pollution controls" },
    { name: "Sports", description: "Youth playgrounds, stadiums, sports kits, and training camps" },
  ];

  console.log("Creating categories...");
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // 2. Seed Geography (Districts, Blocks, Villages)
  console.log("Creating districts, blocks, and villages...");
  
  const districtName = "Patna District";
  const patna = await prisma.district.upsert({
    where: { name: districtName },
    update: {},
    create: {
      name: districtName,
      state: "Bihar",
    },
  });

  const blocksData = [
    {
      name: "Patna Sadar",
      villages: [
        { name: "Digha Village", population: 12500, infraGap: 0.35, road: 0.8, water: 0.7, electricity: 0.9, health: 0.6, edu: 0.7 },
        { name: "Phulwari Village", population: 8400, infraGap: 0.58, road: 0.4, water: 0.5, electricity: 0.6, health: 0.3, edu: 0.4 },
      ],
    },
    {
      name: "Danapur",
      villages: [
        { name: "Nasriganj Village", population: 9200, infraGap: 0.42, road: 0.6, water: 0.7, electricity: 0.8, health: 0.5, edu: 0.6 },
        { name: "Khagaul Village", population: 15400, infraGap: 0.28, road: 0.9, water: 0.8, electricity: 0.9, health: 0.8, edu: 0.8 },
      ],
    },
    {
      name: "Sampatchak",
      villages: [
        { name: "Bariarpur Village", population: 4300, infraGap: 0.75, road: 0.2, water: 0.3, electricity: 0.5, health: 0.1, edu: 0.2 },
        { name: "Kandap Village", population: 3100, infraGap: 0.82, road: 0.1, water: 0.2, electricity: 0.4, health: 0.1, edu: 0.1 },
      ],
    },
  ];

  for (const blockData of blocksData) {
    const block = await prisma.block.upsert({
      where: {
        name_districtId: {
          name: blockData.name,
          districtId: patna.id,
        },
      },
      update: {},
      create: {
        name: blockData.name,
        districtId: patna.id,
      },
    });

    for (const vData of blockData.villages) {
      const village = await prisma.village.upsert({
        where: {
          name_blockId: {
            name: vData.name,
            blockId: block.id,
          },
        },
        update: {
          population: vData.population,
          infrastructureGap: vData.infraGap,
        },
        create: {
          name: vData.name,
          blockId: block.id,
          population: vData.population,
          infrastructureGap: vData.infraGap,
        },
      });

      // Seed Infrastructure Details
      await prisma.infrastructure.upsert({
        where: { villageId: village.id },
        update: {},
        create: {
          villageId: village.id,
          roadQuality: vData.road,
          waterAccess: vData.water,
          electricityAccess: vData.electricity,
          healthAccess: vData.health,
          educationAccess: vData.edu,
        },
      });
    }
  }

  // 3. Seed Users (Citizen, MP, Admin)
  console.log("Creating default seed users...");

  const hashedPassword = await bcrypt.hash("password123", 10);
  const adminHashed = await bcrypt.hash("Admin@123", 10);
  const demoHashed = await bcrypt.hash("123456", 10);

  const users = [
    {
      fullName: "JanSwar Citizen Test",
      email: "citizen@janswar.ai",
      phoneNumber: "9876543210",
      role: Role.CITIZEN,
      passwordHash: hashedPassword,
      city: "Patna Sadar",
      state: "Bihar",
    },
    {
      fullName: "JanSwar Demo Citizen",
      email: "demo@user.com",
      phoneNumber: "9876543209",
      role: Role.CITIZEN,
      passwordHash: demoHashed,
      city: "Patna Sadar",
      state: "Bihar",
    },
    {
      fullName: "Honorable MP Patna",
      email: "mp@patna.janswar.ai",
      phoneNumber: "9876543211",
      role: Role.MP,
      passwordHash: hashedPassword,
      city: "Patna",
      state: "Bihar",
    },
    {
      fullName: "JanSwar Admin Representative",
      email: "admin@janswar.com",
      phoneNumber: "9876543208",
      role: Role.MP,
      passwordHash: adminHashed,
      city: "Patna",
      state: "Bihar",
    },
    {
      fullName: "Patna District Admin",
      email: "admin@patna.janswar.ai",
      phoneNumber: "9876543212",
      role: Role.DISTRICT_ADMIN,
      passwordHash: hashedPassword,
      city: "Patna",
      state: "Bihar",
    },
    {
      fullName: "Super Admin",
      email: "super@janswar.ai",
      phoneNumber: "9876543213",
      role: Role.SUPER_ADMIN,
      passwordHash: hashedPassword,
      city: "Patna",
      state: "Bihar",
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        passwordHash: user.passwordHash,
        city: user.city,
        state: user.state,
      },
      create: user,
    });
  }

  // 4. Seed Suggestions (Fake data for MP dashboard)
  console.log("Creating suggestions and priorities...");
  
  const roadCat = await prisma.category.findFirst({ where: { name: "Road" } });
  const waterCat = await prisma.category.findFirst({ where: { name: "Water" } });
  const healthCat = await prisma.category.findFirst({ where: { name: "Healthcare" } });
  const eduCat = await prisma.category.findFirst({ where: { name: "Education" } });
  const elecCat = await prisma.category.findFirst({ where: { name: "Electricity" } });
  const saniCat = await prisma.category.findFirst({ where: { name: "Sanitation" } });

  const dighaVil = await prisma.village.findFirst({ where: { name: "Digha Village" }, include: { block: true } });
  const phulwariVil = await prisma.village.findFirst({ where: { name: "Phulwari Village" }, include: { block: true } });
  const nasriganjVil = await prisma.village.findFirst({ where: { name: "Nasriganj Village" }, include: { block: true } });
  const khagaulVil = await prisma.village.findFirst({ where: { name: "Khagaul Village" }, include: { block: true } });
  const bariarpurVil = await prisma.village.findFirst({ where: { name: "Bariarpur Village" }, include: { block: true } });
  
  const demoUser = await prisma.user.findFirst({ where: { email: "demo@user.com" } });
  const citizenUserId = demoUser ? demoUser.id : (await prisma.user.findFirst({ where: { role: Role.CITIZEN } }))?.id || "";

  const fakeSuggestions = [
    {
      title: "Repair main connector road potholes in Phulwari",
      description: "The connector road from main highway to Phulwari village entrance has deep potholes causing accidents daily. Need immediate patching.",
      status: "APPROVED" as const,
      latitude: 25.5682,
      longitude: 85.0745,
      categoryId: roadCat?.id,
      districtId: patna.id,
      blockId: phulwariVil?.block.id,
      villageId: phulwariVil?.id,
      sentiment: "NEGATIVE",
      priorityScore: { finalScore: 84.5, demand: 28.0, pop: 18.0, gap: 20.0, urgency: 8.5, budget: 10.0 }
    },
    {
      title: "Severe drinking water contamination in Bariarpur",
      description: "The handpump water is coming out yellow and smelling of iron. Children are falling sick. Need community water filtration plant.",
      status: "ANALYZED" as const,
      latitude: 25.5214,
      longitude: 85.1542,
      categoryId: waterCat?.id,
      districtId: patna.id,
      blockId: bariarpurVil?.block.id,
      villageId: bariarpurVil?.id,
      sentiment: "NEGATIVE",
      priorityScore: { finalScore: 92.1, demand: 30.0, pop: 22.0, gap: 25.0, urgency: 10.0, budget: 5.1 }
    },
    {
      title: "Lack of doctors at Nasriganj Primary Health Centre",
      description: "The primary health clinic is opened but there are no resident doctors or nurses. Patients have to travel 15km to district hospital in emergencies.",
      status: "ANALYZED" as const,
      latitude: 25.6241,
      longitude: 85.0942,
      categoryId: healthCat?.id,
      districtId: patna.id,
      blockId: nasriganjVil?.block.id,
      villageId: nasriganjVil?.id,
      sentiment: "NEGATIVE",
      priorityScore: { finalScore: 78.4, demand: 26.0, pop: 17.5, gap: 20.0, urgency: 8.0, budget: 6.9 }
    },
    {
      title: "Rebuild boundary wall of Digha High School",
      description: "The boundary wall fell during heavy rain. Stray animals enter the school campus during study hours. Safety concern for students.",
      status: "PENDING" as const,
      latitude: 25.6321,
      longitude: 85.1012,
      categoryId: eduCat?.id,
      districtId: patna.id,
      blockId: dighaVil?.block.id,
      villageId: dighaVil?.id,
      sentiment: "NEUTRAL",
      priorityScore: { finalScore: 56.2, demand: 15.0, pop: 16.0, gap: 15.0, urgency: 6.0, budget: 4.2 }
    },
    {
      title: "Replace faulty transformer in Khagaul",
      description: "The transformer has burnt out three days ago. The village is in complete darkness. Students cannot study at night.",
      status: "PROCESSING" as const,
      latitude: 25.5896,
      longitude: 85.0514,
      categoryId: elecCat?.id,
      districtId: patna.id,
      blockId: khagaulVil?.block.id,
      villageId: khagaulVil?.id,
      sentiment: "NEGATIVE",
      priorityScore: { finalScore: 79.5, demand: 25.0, pop: 20.0, gap: 19.5, urgency: 9.0, budget: 6.0 }
    },
    {
      title: "Improve drainage system near Phulwari market",
      description: "Open drains are overflowing on the road causing garbage buildup and mosquito breeding. Urgent sanitation intervention required.",
      status: "APPROVED" as const,
      latitude: 25.5678,
      longitude: 85.0740,
      categoryId: saniCat?.id,
      districtId: patna.id,
      blockId: phulwariVil?.block.id,
      villageId: phulwariVil?.id,
      sentiment: "NEGATIVE",
      priorityScore: { finalScore: 82.0, demand: 27.5, pop: 18.0, gap: 22.0, urgency: 9.5, budget: 5.0 }
    }
  ];

  for (const s of fakeSuggestions) {
    // Upsert suggestion by matching title
    let suggestion = await prisma.suggestion.findFirst({
      where: { title: s.title }
    });

    if (!suggestion) {
      suggestion = await prisma.suggestion.create({
        data: {
          title: s.title,
          description: s.description,
          latitude: s.latitude,
          longitude: s.longitude,
          status: s.status,
          userId: citizenUserId,
          categoryId: s.categoryId || null,
          districtId: s.districtId || null,
          blockId: s.blockId || null,
          villageId: s.villageId || null,
        }
      });
    }

    // Upsert priority score
    await prisma.priorityScore.upsert({
      where: { suggestionId: suggestion.id },
      update: {
        citizenDemandWeight: s.priorityScore.demand,
        populationWeight: s.priorityScore.pop,
        infrastructureGap: s.priorityScore.gap,
        urgencyWeight: s.priorityScore.urgency,
        budgetWeight: s.priorityScore.budget,
        finalScore: s.priorityScore.finalScore,
      },
      create: {
        suggestionId: suggestion.id,
        citizenDemandWeight: s.priorityScore.demand,
        populationWeight: s.priorityScore.pop,
        infrastructureGap: s.priorityScore.gap,
        urgencyWeight: s.priorityScore.urgency,
        budgetWeight: s.priorityScore.budget,
        finalScore: s.priorityScore.finalScore,
      }
    });
  }

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

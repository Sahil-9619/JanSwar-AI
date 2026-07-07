import { PrismaClient, Role } from "@prisma/client";

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

  const users = [
    {
      clerkId: "user_mock_citizen_123",
      fullName: "JanSwar Citizen Test",
      email: "citizen@janswar.ai",
      phoneNumber: "9876543210",
      role: Role.CITIZEN,
    },
    {
      clerkId: "user_mock_mp_456",
      fullName: "Honorable MP Patna",
      email: "mp@patna.janswar.ai",
      phoneNumber: "9876543211",
      role: Role.MP,
    },
    {
      clerkId: "user_mock_admin_789",
      fullName: "Patna District Admin",
      email: "admin@patna.janswar.ai",
      phoneNumber: "9876543212",
      role: Role.DISTRICT_ADMIN,
    },
    {
      clerkId: "user_mock_super_000",
      fullName: "Super Admin",
      email: "super@janswar.ai",
      phoneNumber: "9876543213",
      role: Role.SUPER_ADMIN,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { phoneNumber: user.phoneNumber },
      update: {
        clerkId: user.clerkId,
      },
      create: user,
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

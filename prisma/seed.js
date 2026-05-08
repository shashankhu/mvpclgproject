// ─────────────────────────────────────────────
// Diganta — Database Seed Script
// Initializes the database with default users and clubs
// ─────────────────────────────────────────────

import { config } from "dotenv";
import prismaPkg from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "../src/lib/auth.js";

const { PrismaClient } = prismaPkg;

// Load environment variables
config({ path: ".env.local" });

// Create connection pool and adapter for Prisma v7
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["warn", "error"],
});

async function main() {
  console.log("🌱 Starting database seed...");

  // ─── Create Default Users ───
  const users = [
    {
      name: "System Administrator",
      email: "admin@college.edu",
      role: "admin",
      department: "Administration",
    },
    {
      name: "Dr. Jane Smith",
      email: "dean@college.edu",
      role: "dean",
      department: "Academic Affairs",
    },
    {
      name: "Prof. Robert Johnson",
      email: "principal@college.edu",
      role: "principal",
      department: "Administration",
    },
    {
      name: "Dr. Alice Brown",
      email: "faculty1@college.edu",
      role: "faculty_coordinator",
      department: "Computer Science",
    },
    {
      name: "Dr. Mike Davis",
      email: "faculty2@college.edu",
      role: "faculty_coordinator",
      department: "Electronics",
    },
    {
      name: "John Doe",
      email: "student1@college.edu",
      role: "club_head",
      department: "Computer Science",
    },
    {
      name: "Sarah Wilson",
      email: "student2@college.edu",
      role: "student",
      department: "Computer Science",
    },
    {
      name: "Transport Manager",
      email: "transport@college.edu",
      role: "transport",
      department: "Transport",
    },
    {
      name: "Security Chief",
      email: "security@college.edu",
      role: "security",
      department: "Security",
    },
    {
      name: "Resource Manager",
      email: "resource@college.edu",
      role: "resource",
      department: "Resources",
    },
    {
      name: "Finance Manager",
      email: "finance@college.edu",
      role: "finance",
      department: "Finance",
    },
  ];

  const defaultPassword = await hashPassword("password123");

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        passwordHash: defaultPassword,
      },
    });
    console.log(`✓ Created user: ${userData.name} (${userData.role})`);
  }

  // ─── Get Faculty Coordinators for Club Assignment ───
  const aliceBrown = await prisma.user.findUnique({ where: { email: "faculty1@college.edu" } });
  const mikeDavis = await prisma.user.findUnique({ where: { email: "faculty2@college.edu" } });

  // ─── Create Default Clubs ───
  const clubs = [
    {
      name: "Computer Science Club",
      description: "Promoting tech innovation and coding excellence",
      department: "Computer Science",
      type: "departmental",
      facultyCoordinatorId: aliceBrown.id,
    },
    {
      name: "Electronics Society",
      description: "Advancing electronics and circuit design",
      department: "Electronics",
      type: "departmental",
      facultyCoordinatorId: mikeDavis.id,
    },
    {
      name: "Cultural Committee",
      description: "Organizing cultural events and festivals",
      department: null,
      type: "non_departmental",
      facultyCoordinatorId: aliceBrown.id,
    },
    {
      name: "Sports Club",
      description: "Promoting sports and physical fitness",
      department: null,
      type: "non_departmental",
      facultyCoordinatorId: mikeDavis.id,
    },
  ];

  for (const clubData of clubs) {
    const club = await prisma.club.upsert({
      where: { name: clubData.name },
      update: {},
      create: clubData,
    });
    console.log(`✓ Created club: ${club.name}`);
  }

  // ─── Assign Club Head Membership ───
  const johnDoe = await prisma.user.findUnique({ where: { email: "student1@college.edu" } });
  const csClub = await prisma.club.findUnique({ where: { name: "Computer Science Club" } });

  await prisma.clubMember.upsert({
    where: {
      userId_clubId: {
        userId: johnDoe.id,
        clubId: csClub.id,
      },
    },
    update: {},
    create: {
      userId: johnDoe.id,
      clubId: csClub.id,
      role: "head",
    },
  });
  console.log(`✓ Assigned ${johnDoe.name} as head of ${csClub.name}`);

  console.log("🎉 Database seeded successfully!");
  console.log("\n📋 Default Login Credentials:");
  console.log("Admin: admin@college.edu / password123");
  console.log("Dean: dean@college.edu / password123");
  console.log("Club Head: student1@college.edu / password123");
  console.log("Student: student2@college.edu / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

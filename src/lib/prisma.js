// ─────────────────────────────────────────────
// Diganta — Singleton Prisma Client
// ─────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prisma) {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  globalForPrisma.prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

prisma = globalForPrisma.prisma;
export default prisma;

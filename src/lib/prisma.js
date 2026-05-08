// ─────────────────────────────────────────────
// Diganta — Singleton Prisma Client
// ─────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

if (!globalForPrisma.prisma) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DATABASE_POOL_SIZE || "20", 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  globalForPrisma.prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma;
export default prisma;

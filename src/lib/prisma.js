// ─────────────────────────────────────────────
// Diganta — Singleton Prisma Client
// ─────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis;

let prisma;

if (!globalForPrisma.prismaClientV2) {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({
    connectionString,
    max: parseInt(process.env.DATABASE_POOL_SIZE || "20", 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  const adapter = new PrismaPg(pool);

  globalForPrisma.prismaClientV2 = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

prisma = globalForPrisma.prismaClientV2;
export default prisma;
const adapter = new PrismaPg(pool);

globalForPrisma.prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
}

export const prisma = globalForPrisma.prisma;
export default prisma;

import { config } from 'dotenv';
config();

import prisma from './src/lib/prisma.js';

async function test() {
  try {
    const page = 1;
    const limit = 20;
    const skip = 0;
    const where = {};

    console.log("Running vendor query...");
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          companyName: true,
          contactPerson: true,
          phone: true,
          email: true,
          categories: true,
          isVerified: true,
          verifiedAt: true,
          rating: true,
          totalOrders: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true, isActive: true } },
          verifiedBy: { select: { id: true, name: true } },
          _count: {
            select: {
              quotations: true,
              documents: true,
              awardedQuotationRequests: true,
            },
          },
        },
      }),
      prisma.vendor.count({ where }),
    ]);
    console.log("Success! Total vendors:", total);
  } catch (err) {
    console.error("Query failed!");
    console.error(err.message);
    console.error(err.stack);
  } finally {
    process.exit(0);
  }
}

test();

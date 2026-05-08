import prisma from './src/lib/prisma.js';

async function test() {
  try {
    const bills = await prisma.vendorBill.findMany({ take: 1 });
    console.log("Bills fetched successfully:", bills);
  } catch (e) {
    console.error("Prisma error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();

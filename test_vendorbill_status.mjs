import prisma from './src/lib/prisma.js';

async function test() {
  try {
    const bills = await prisma.vendorBill.count({ where: { status: "pending" } });
    console.log("Count:", bills);
  } catch (e) {
    console.error("Prisma error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();

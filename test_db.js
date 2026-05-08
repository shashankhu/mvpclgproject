const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    const vendors = await p.vendor.findMany({ take: 1, select: { id: true, companyName: true } });
    console.log('VENDOR_QUERY_OK:', JSON.stringify(vendors));
    
    const vendorCount = await p.vendor.count();
    console.log('VENDOR_COUNT:', vendorCount);

    const billCount = await p.vendorBill.count();
    console.log('BILL_COUNT:', billCount);

    const qrCount = await p.quotationRequest.count();
    console.log('QR_COUNT:', qrCount);

    // Test the exact query from dashboard API
    const unverified = await p.vendor.count({ where: { isVerified: false } });
    console.log('UNVERIFIED_VENDORS:', unverified);

    const pendingBills = await p.vendorBill.count({ where: { paymentStatus: 'pending' } });
    console.log('PENDING_BILLS:', pendingBills);

  } catch (e) {
    console.log('ERROR:', e.message);
    console.log('STACK:', e.stack);
  } finally {
    await p.$disconnect();
  }
}

test();

import prisma from './src/lib/prisma.js';

async function test() {
  try {
    const vendors = await prisma.vendor.findMany({ take: 1, select: { id: true, companyName: true } });
    console.log('VENDOR_QUERY_OK:', JSON.stringify(vendors));
    
    const vendorCount = await prisma.vendor.count();
    console.log('VENDOR_COUNT:', vendorCount);

  } catch (e) {
    console.log('ERROR:', e.message);
    console.log('STACK:', e.stack);
  } finally {
    process.exit(0);
  }
}

test();

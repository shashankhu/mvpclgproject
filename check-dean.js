import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkDean() {
  console.log('👤 Checking dean user details...');

  const dean = await prisma.user.findUnique({
    where: { email: 'dean@college.edu' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      passwordHash: true
    }
  });

  console.log('Dean user details:');
  console.log('  Email:', dean.email);
  console.log('  Name:', dean.name);
  console.log('  Role:', dean.role);
  console.log('  Is Active:', dean.isActive);
  console.log('  Has password hash:', !!dean.passwordHash);

  await prisma.$disconnect();
  await pool.end();
}

checkDean().catch(console.error);
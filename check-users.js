import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkUsers() {
  console.log('👥 Checking database users...');

  const users = await prisma.user.findMany({
    select: {
      email: true,
      role: true,
      passwordHash: true
    }
  });

  console.log(`Found ${users.length} users:`);

  const dean = users.find(u => u.email === 'dean@college.edu');
  if (dean) {
    console.log('✅ Dean user exists');
    console.log('   Email:', dean.email);
    console.log('   Role:', dean.role);
    console.log('   Has password hash:', !!dean.passwordHash);
  } else {
    console.log('❌ Dean user NOT found');
  }

  await prisma.$disconnect();
  await pool.end();
}

checkUsers().catch(console.error);
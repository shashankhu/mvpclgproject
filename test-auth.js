import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testAuth() {
  console.log('🔐 Testing authentication...');

  const dean = await prisma.user.findUnique({
    where: { email: 'dean@college.edu' }
  });

  console.log('Dean found:', !!dean);

  if (dean) {
    const testPassword = 'password123';
    console.log('Testing password:', testPassword);
    console.log('Stored hash:', dean.passwordHash);

    const isValid = await bcrypt.compare(testPassword, dean.passwordHash);
    console.log('Password valid:', isValid);
  }

  await prisma.$disconnect();
  await pool.end();
}

testAuth().catch(console.error);
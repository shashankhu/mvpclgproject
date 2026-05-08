import { config } from 'dotenv';
config({ path: '.env.local' });
import prisma from './src/lib/prisma.js';

async function check() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true }
  });
  console.log("Users in DB:", users);
  process.exit(0);
}
check();

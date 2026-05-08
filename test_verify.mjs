import jwt from 'jsonwebtoken';
import { config } from 'dotenv';
config({ path: '.env.local' });
import prisma from './src/lib/prisma.js';

async function test() {
  try {
    const superadmin = await prisma.user.findFirst({ where: { email: 'superadmin@college.edu' } });
    if (!superadmin) {
      console.log("No superadmin found.");
      return process.exit(1);
    }
    console.log("Superadmin ID:", superadmin.id);

    const vendor = await prisma.vendor.findFirst({ where: { isVerified: false } });
    if (!vendor) {
      console.log("No unverified vendor found.");
      return process.exit(1);
    }
    console.log("Target Vendor ID:", vendor.id);

    const token = jwt.sign(
      { userId: superadmin.id, role: superadmin.role, email: superadmin.email },
      process.env.JWT_SECRET || "diganta_development_jwt_secret_key_super_long_and_secure",
      { expiresIn: "1h" }
    );

    console.log("Verifying vendor via API...");
    const res = await fetch(`http://localhost:3000/api/vendors/${vendor.id}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "verify" })
    });

    const text = await res.text();
    console.log("Status:", res.status);
    try {
      console.log("Response:", JSON.parse(text));
    } catch {
      console.log("Response text:", text);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

test();

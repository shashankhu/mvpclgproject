// ─────────────────────────────────────────────
// POST /api/auth/login
// Authenticate user and return JWT
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { comparePassword, generateToken } from "@/lib/auth";
import { success, error, validateRequired } from "@/lib/api";

export async function POST(request) {
  try {
    const body = await request.json();

    const missing = validateRequired(body, ["email", "password"]);
    if (missing) return error(missing);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return error("Invalid email or password", 401);
    }

    if (!user.isActive) {
      return error("Account is deactivated", 403);
    }

    // Verify password
    const valid = await comparePassword(body.password, user.passwordHash);
    if (!valid) {
      return error("Invalid email or password", 401);
    }

    // Generate token
    const token = generateToken(user);

    return success({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    console.error("[login]", err);
    return error("Internal server error", 500);
  }
}

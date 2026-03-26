// ─────────────────────────────────────────────
// POST /api/auth/signup
// Create a new user account
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { hashPassword, generateToken } from "@/lib/auth";
import { success, error, validateRequired, validateEmail, validateEnum } from "@/lib/api";
import { ALL_ROLES } from "@/lib/constants";

export async function POST(request) {
  try {
    const body = await request.json();

    // Validate required fields
    const missing = validateRequired(body, ["name", "email", "password", "role"]);
    if (missing) return error(missing);

    // Validate email format
    if (!validateEmail(body.email)) {
      return error("Invalid email format");
    }

    // Validate role
    const roleError = validateEnum(body.role, ALL_ROLES, "role");
    if (roleError) return error(roleError);

    // Validate password strength
    if (body.password.length < 6) {
      return error("Password must be at least 6 characters");
    }

    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return error("Email already registered", 409);
    }

    // Create user
    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
        department: body.department || null,
        phone: body.phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    const token = generateToken(user);

    return success({ user, token }, 201);
  } catch (err) {
    console.error("[signup]", err);
    return error("Internal server error", 500);
  }
}

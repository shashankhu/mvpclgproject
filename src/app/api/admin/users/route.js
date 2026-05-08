// ─────────────────────────────────────────────
// GET  /api/admin/users — List all users for administration
// POST /api/admin/users — Authoritative user creation (replacing open signup)
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticateStrict } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { success, error, unauthorized, forbidden, validateRequired, validateEmail, validateEnum } from "@/lib/api";
import { ALL_ROLES, ROLES } from "@/lib/constants";

export async function GET(request) {
  try {
    const decoded = await authenticateStrict(request);
    if (!decoded) return unauthorized();

    if (decoded.role !== ROLES.SUPER_ADMIN && decoded.role !== ROLES.ADMIN) {
      return forbidden("Only administrators can view the full user list");
    }

    const { searchParams } = new URL(request.url);
    const roleLimit = searchParams.get("role");

    const where = {};
    if (roleLimit) {
      where.role = roleLimit;
    }

    const users = await prisma.user.findMany({
      where,
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return success({ users, count: users.length });
  } catch (err) {
    console.error("[admin:users:list]", err);
    return error("Internal server error", 500);
  }
}

export async function POST(request) {
  try {
    const decoded = await authenticateStrict(request);
    if (!decoded) return unauthorized();

    if (decoded.role !== ROLES.SUPER_ADMIN && decoded.role !== ROLES.ADMIN) {
      return forbidden("Only administrators can create authoritative accounts");
    }

    const body = await request.json();

    const missing = validateRequired(body, ["name", "email", "password", "role"]);
    if (missing) return error(missing);

    if (!validateEmail(body.email)) {
      return error("Invalid email format");
    }

    const roleError = validateEnum(body.role, ALL_ROLES, "role");
    if (roleError) return error(roleError);

    // Only SUPER_ADMIN can create another SUPER_ADMIN or ADMIN
    if ((body.role === ROLES.SUPER_ADMIN || body.role === ROLES.ADMIN) && decoded.role !== ROLES.SUPER_ADMIN) {
      return forbidden("Only super administrators can create other admin accounts");
    }

    if (body.password.length < 6) {
      return error("Password must be at least 6 characters");
    }

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });
    if (existing) {
      return error("Email already registered", 409);
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        role: body.role,
        department: body.department || null,
        phone: body.phone || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    });

    return success({ user, message: "User account created successfully" }, 201);
  } catch (err) {
    console.error("[admin:users:create]", err);
    return error("Internal server error", 500);
  }
}

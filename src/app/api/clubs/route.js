// ─────────────────────────────────────────────
// GET   /api/clubs — List clubs
// POST  /api/clubs — Create club
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, validateRequired } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const clubs = await prisma.club.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { members: true, events: true },
        },
      },
    });

    return success({ clubs });
  } catch (err) {
    console.error("[clubs:list]", err);
    return error("Internal server error", 500);
  }
}

export async function POST(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    // Admin, Dean, or Faculty can create clubs
    const allowed = [ROLES.ADMIN, ROLES.DEAN, ROLES.FACULTY_COORDINATOR];
    if (!allowed.includes(decoded.role)) {
      return forbidden("Only admin, dean, or faculty can create clubs");
    }

    const body = await request.json();

    const missing = validateRequired(body, ["name"]);
    if (missing) return error(missing);

    // Check for duplicate name
    const existing = await prisma.club.findUnique({
      where: { name: body.name },
    });
    if (existing) return error("A club with this name already exists", 409);

    const club = await prisma.club.create({
      data: {
        name: body.name,
        description: body.description || null,
        department: body.department || null,
        logoUrl: body.logoUrl || null,
      },
    });

    return success({ club }, 201);
  } catch (err) {
    console.error("[clubs:create]", err);
    return error("Internal server error", 500);
  }
}

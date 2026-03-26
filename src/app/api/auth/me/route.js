// ─────────────────────────────────────────────
// GET /api/auth/me — Get current user profile
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, unauthorized } from "@/lib/api";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        clubMemberships: {
          include: {
            club: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user) return unauthorized("User not found");

    return success({ user });
  } catch (err) {
    console.error("[me]", err);
    return unauthorized("Invalid token");
  }
}

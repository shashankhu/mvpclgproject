// ─────────────────────────────────────────────
// POST /api/clubs/[id]/members — Add member to club
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound, conflict, validateRequired } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function POST(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const missing = validateRequired(body, ["userId"]);
    if (missing) return error(missing);

    // Verify club exists
    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) return notFound("Club not found");

    // Check permissions: admin, faculty, or club head
    const allowed = [ROLES.ADMIN, ROLES.DEAN, ROLES.FACULTY_COORDINATOR];
    if (!allowed.includes(decoded.role)) {
      // Check if they're the club head
      const isHead = await prisma.clubMember.findFirst({
        where: { clubId: id, userId: decoded.userId, role: "head" },
      });
      if (!isHead) return forbidden("Only club heads, admin, or faculty can add members");
    }

    // Check for duplicate
    const existing = await prisma.clubMember.findUnique({
      where: { userId_clubId: { userId: body.userId, clubId: id } },
    });
    if (existing) return conflict("User is already a member of this club");

    const member = await prisma.clubMember.create({
      data: {
        userId: body.userId,
        clubId: id,
        role: body.role || "member",
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        club: { select: { id: true, name: true } },
      },
    });

    return success({ member }, 201);
  } catch (err) {
    console.error("[clubs:addMember]", err);
    return error("Internal server error", 500);
  }
}

export async function GET(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;

    const members = await prisma.clubMember.findMany({
      where: { clubId: id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    return success({ members });
  } catch (err) {
    console.error("[clubs:members]", err);
    return error("Internal server error", 500);
  }
}

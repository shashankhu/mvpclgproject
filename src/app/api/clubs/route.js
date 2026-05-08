// ─────────────────────────────────────────────
// GET   /api/clubs — List clubs
// POST  /api/clubs — Create club
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, validateRequired, validateEnum } from "@/lib/api";
import { ROLES, CLUB_TYPES, ALL_CLUB_TYPES } from "@/lib/constants";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const clubs = await prisma.club.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 100,
      include: {
        _count: {
          select: { members: true, events: true },
        },
        facultyCoordinator: {
          select: { id: true, name: true, email: true, department: true },
        },
        members: {
          where: { role: "head" },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
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

    // Validate required fields
    const missing = validateRequired(body, ["name", "type", "facultyCoordinatorId", "headUserId"]);
    if (missing) return error(missing);

    // Validate club type
    const typeError = validateEnum(body.type, ALL_CLUB_TYPES, "type");
    if (typeError) return error(typeError);

    // Departmental clubs require department field
    if (body.type === CLUB_TYPES.DEPARTMENTAL && !body.department) {
      return error("Department is required for departmental clubs");
    }

    // Verify faculty coordinator exists and has the right role
    const fc = await prisma.user.findUnique({
      where: { id: body.facultyCoordinatorId },
      select: { id: true, role: true },
    });
    if (!fc) return error("Faculty coordinator not found", 404);
    if (fc.role !== ROLES.FACULTY_COORDINATOR) {
      return error("Selected user is not a faculty coordinator");
    }

    // Verify club head user exists and is a student
    const headUser = await prisma.user.findUnique({
      where: { id: body.headUserId },
      select: { id: true, role: true },
    });
    if (!headUser) return error("Club head user not found", 404);
    if (![ROLES.STUDENT, ROLES.CLUB_HEAD].includes(headUser.role)) {
      return error("Club head must be a student");
    }

    // Check for duplicate name
    const existing = await prisma.club.findUnique({
      where: { name: body.name },
    });
    if (existing) return error("A club with this name already exists", 409);

    // Create club and add head member in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the club
      const club = await tx.club.create({
        data: {
          name: body.name,
          description: body.description || null,
          department: body.type === CLUB_TYPES.DEPARTMENTAL ? body.department : null,
          logoUrl: body.logoUrl || null,
          type: body.type,
          facultyCoordinatorId: body.facultyCoordinatorId,
        },
      });

      // Add the head as a club member
      await tx.clubMember.create({
        data: {
          userId: body.headUserId,
          clubId: club.id,
          role: "head",
        },
      });

      // Update the user's role to CLUB_HEAD if they are still a student
      if (headUser.role === ROLES.STUDENT) {
        await tx.user.update({
          where: { id: body.headUserId },
          data: { role: ROLES.CLUB_HEAD },
        });
      }

      // Fetch the complete club with relations
      const completeClub = await tx.club.findUnique({
        where: { id: club.id },
        include: {
          facultyCoordinator: {
            select: { id: true, name: true, email: true, department: true },
          },
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, role: true } },
            },
          },
          _count: {
            select: { members: true, events: true },
          },
        },
      });

      return completeClub;
    });

    return success({ club: result }, 201);
  } catch (err) {
    console.error("[clubs:create]", err);
    return error("Internal server error", 500);
  }
}

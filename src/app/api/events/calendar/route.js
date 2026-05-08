// ─────────────────────────────────────────────
// GET /api/events/calendar — Get events with dates for calendar view
// Returns events grouped by date for the given month/year
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear());
    const month = parseInt(searchParams.get("month") || new Date().getMonth() + 1); // 1-indexed

    // Build date range for the month (include padding for calendar grid)
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch events that have a date in this range
    const where = {
      eventDate: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    };

    // Role-based filtering
    const role = decoded.role;
    const userId = decoded.userId;

    if (role === ROLES.STUDENT || role === ROLES.CLUB_HEAD) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { clubMemberships: { select: { clubId: true } } },
      });
      const clubIds = user?.clubMemberships.map((m) => m.clubId) || [];

      where.OR = [
        { clubId: { in: clubIds } },
        { eventType: "standard" },
      ];
    } else if (role === ROLES.FACULTY_COORDINATOR) {
      // FCs see events from their coordinated clubs + standard events
      const coordinatedClubs = await prisma.club.findMany({
        where: { facultyCoordinatorId: userId, isActive: true },
        select: { id: true },
      });
      const clubIds = coordinatedClubs.map((c) => c.id);
      where.OR = [
        { clubId: { in: clubIds } },
        { eventType: "standard" },
      ];
    }
    // Dean, Principal, Admin, Dept roles see all events

    const events = await prisma.event.findMany({
      where,
      orderBy: { eventDate: "asc" },
      select: {
        id: true,
        title: true,
        type: true,
        eventType: true,
        status: true,
        eventDate: true,
        eventEndDate: true,
        venue: true,
        club: { select: { id: true, name: true } },
      },
    });

    return success({ events, year, month });
  } catch (err) {
    console.error("[events:calendar]", err);
    return error("Internal server error", 500);
  }
}

// ─────────────────────────────────────────────
// POST /api/events/[id]/submit — Submit event for approval
// Moves from DRAFT → WAITING_FOR_FACULTY
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound, conflict } from "@/lib/api";
import { EVENT_STATUS, ROLES } from "@/lib/constants";

export async function POST(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        club: true,
      },
    });

    if (!event) return notFound("Event not found");

    // Only the creator can submit
    if (event.createdById !== decoded.userId) {
      return forbidden("Only the event creator can submit for approval");
    }

    // Only DRAFT events can be submitted
    if (event.status !== EVENT_STATUS.DRAFT) {
      return conflict(`Event is in "${event.status}" status, not DRAFT`);
    }

    // Validate minimum required fields for submission
    if (!event.title || !event.description) {
      return error("Event must have a title and description before submission");
    }

    // Update status and notify faculty coordinators
    const [updatedEvent] = await prisma.$transaction([
      prisma.event.update({
        where: { id },
        data: { status: EVENT_STATUS.WAITING_FOR_FACULTY },
      }),
      // Notify all faculty coordinators
      prisma.notification.createMany({
        data: await getFacultyNotifications(id, event.title),
      }),
    ]);

    return success({
      event: updatedEvent,
      message: "Event submitted for faculty review",
    });
  } catch (err) {
    console.error("[events:submit]", err);
    return error("Internal server error", 500);
  }
}

async function getFacultyNotifications(eventId, eventTitle) {
  const faculty = await prisma.user.findMany({
    where: { role: ROLES.FACULTY_COORDINATOR, isActive: true },
    select: { id: true },
  });

  return faculty.map((f) => ({
    userId: f.id,
    eventId,
    type: "approval_required",
    title: "New Event for Review",
    message: `Event "${eventTitle}" has been submitted and awaits your review.`,
  }));
}

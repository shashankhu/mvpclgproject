// ─────────────────────────────────────────────
// GET /api/events/[id]/subevents — Get sub-events for a standard event
// POST /api/events/[id]/subevents — Create sub-event within standard event
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, validateRequired } from "@/lib/api";
import { ROLES, EVENT_STATUS, EVENT_TYPES, ALL_ROLES } from "@/lib/constants";

export async function GET(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id: parentEventId } = await params;

    // Verify parent event exists and is a standard event
    const parentEvent = await prisma.event.findUnique({
      where: { id: parentEventId },
      include: {
        club: { select: { id: true, name: true } },
        createdBy: { select: { name: true, role: true } },
      },
    });

    if (!parentEvent) {
      return error("Parent event not found", 404);
    }

    if (parentEvent.eventType !== "standard") {
      return error("Only standard events can have sub-events", 400);
    }

    // Get all sub-events for this standard event
    const subEvents = await prisma.event.findMany({
      where: { parentEventId },
      orderBy: { createdAt: "desc" },
      include: {
        club: { select: { id: true, name: true } },
        createdBy: { select: { name: true, role: true } },
        _count: {
          select: {
            resourceRequests: true,
            tasks: true,
            expenses: true
          }
        },
      },
    });

    return success({
      parentEvent: {
        id: parentEvent.id,
        title: parentEvent.title,
        description: parentEvent.description,
        status: parentEvent.status,
        eventDate: parentEvent.eventDate,
        eventEndDate: parentEvent.eventEndDate,
        club: parentEvent.club,
        createdBy: parentEvent.createdBy,
      },
      subEvents
    });
  } catch (err) {
    console.error("[events:subevents:GET]", err);
    return error("Internal server error", 500);
  }
}

export async function POST(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id: parentEventId } = await params;
    const { role, userId } = decoded;
    const body = await request.json();

    // Verify parent event exists and is a standard event
    const parentEvent = await prisma.event.findUnique({
      where: { id: parentEventId },
      include: {
        participants: { include: { club: true } },
      },
    });

    if (!parentEvent) {
      return error("Parent event not found", 404);
    }

    if (parentEvent.eventType !== "standard") {
      return error("Only standard events can have sub-events", 400);
    }

    if (parentEvent.status !== EVENT_STATUS.APPROVED) {
      return error("Can only create sub-events in approved standard events", 400);
    }

    // Validate required fields
    const validationError = validateRequired(body, [
      "title", "description", "type", "clubId"
    ]);
    if (validationError) return error(validationError);

    // Verify user has permission to create events for this club
    const clubMembership = await prisma.clubMember.findUnique({
      where: {
        userId_clubId: { userId, clubId: body.clubId }
      },
    });

    const isClubMember = clubMembership !== null;
    const isClubHead = clubMembership?.role === "head";
    const canCreateEvents = role === ROLES.DEAN || role === ROLES.ADMIN || isClubHead;

    if (!canCreateEvents) {
      return forbidden("Only club heads can create sub-events for their clubs");
    }

    // Verify club has joined the standard event
    const participation = await prisma.eventParticipant.findUnique({
      where: {
        eventId_clubId: {
          eventId: parentEventId,
          clubId: body.clubId,
        },
      },
    });

    if (!participation) {
      return error("Club must join the standard event before creating sub-events", 400);
    }

    // Create the sub-event (requires Dean approval like regular events)
    const subEvent = await prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        type: body.type,
        eventType: "club", // Sub-events are always club events
        status: EVENT_STATUS.WAITING_FOR_DEAN, // Sub-events require Dean approval
        objectives: body.objectives || null,
        targetAudience: body.targetAudience || null,
        expectedAttendance: body.expectedAttendance ? parseInt(body.expectedAttendance) : null,
        venue: body.venue || null,
        eventDate: body.eventDate ? new Date(body.eventDate) : null,
        eventEndDate: body.eventEndDate ? new Date(body.eventEndDate) : null,
        budgetEstimate: body.budgetEstimate ? parseFloat(body.budgetEstimate) : 0,
        needsTransport: body.needsTransport || false,
        needsSecurity: body.needsSecurity || false,
        needsResources: body.needsResources || false,
        transportNotes: body.transportNotes || null,
        securityNotes: body.securityNotes || null,
        resourceNotes: body.resourceNotes || null,
        createdById: userId,
        clubId: body.clubId,
        parentEventId, // Link to parent standard event
      },
      include: {
        club: { select: { id: true, name: true } },
        createdBy: { select: { name: true, role: true } },
        parentEvent: { select: { id: true, title: true } },
      },
    });

    // Create notification for all Deans about pending sub-event approval
    const deans = await prisma.user.findMany({
      where: { role: "dean", isActive: true },
      select: { id: true },
    });

    if (deans.length > 0) {
      await prisma.notification.createMany({
        data: deans.map((dean) => ({
          userId: dean.id,
          eventId: subEvent.id,
          type: "approval_required",
          title: "Sub-Event Approval Required",
          message: `New sub-event "${subEvent.title}" within "${parentEvent.title}" requires your approval from ${subEvent.club.name}.`,
        })),
      });
    }

    return success({
      subEvent,
      message: "Sub-event created and submitted for Dean approval!"
    });
  } catch (err) {
    console.error("[events:subevents:POST]", err);
    return error("Internal server error", 500);
  }
}
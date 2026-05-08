// ─────────────────────────────────────────────
// GET /api/events/[id]/resources — Get resource requests for an event
// POST /api/events/[id]/resources — Create resource request for an event
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, validateRequired } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function GET(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id: eventId } = await params;

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: { select: { id: true, name: true } },
        parentEvent: { select: { id: true, title: true } },
      },
    });

    if (!event) {
      return error("Event not found", 404);
    }

    // Get all resource requests for this event
    const resourceRequests = await prisma.resourceRequest.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      include: {
        club: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, role: true } },
        reviewedBy: { select: { id: true, name: true, role: true } },
      },
    });

    return success({
      event: {
        id: event.id,
        title: event.title,
        eventType: event.eventType,
        status: event.status,
        club: event.club,
        parentEvent: event.parentEvent,
      },
      resourceRequests
    });
  } catch (err) {
    console.error("[events:resources:GET]", err);
    return error("Internal server error", 500);
  }
}

export async function POST(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id: eventId } = await params;
    const { role, userId } = decoded;
    const body = await request.json();

    // Verify event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        club: { select: { id: true, name: true } },
        parentEvent: { select: { id: true, title: true, status: true } },
        participants: { include: { club: true } },
      },
    });

    if (!event) {
      return error("Event not found", 404);
    }

    // Validate required fields
    const validationError = validateRequired(body, [
      "title", "description", "category", "clubId"
    ]);
    if (validationError) return error(validationError);

    // Verify user has permission to create resource request for this club
    const clubMembership = await prisma.clubMember.findUnique({
      where: {
        userId_clubId: { userId, clubId: body.clubId }
      },
    });

    const isClubMember = clubMembership !== null;
    const isClubHead = clubMembership?.role === "head";
    const canCreateRequest = role === ROLES.DEAN || role === ROLES.ADMIN || isClubHead;

    if (!canCreateRequest) {
      return forbidden("Only club heads can create resource requests for their clubs");
    }

    // For sub-events, verify club has joined the parent standard event
    if (event.parentEvent) {
      const participation = await prisma.eventParticipant.findUnique({
        where: {
          eventId_clubId: {
            eventId: event.parentEvent.id,
            clubId: body.clubId,
          },
        },
      });

      if (!participation) {
        return error("Club must join the standard event before creating resource requests", 400);
      }
    }

    // For regular events, verify club is associated with the event
    if (!event.parentEvent && event.eventType === "club" && event.clubId !== body.clubId) {
      return error("Can only create resource requests for your own club's events", 400);
    }

    // Create the resource request
    const resourceRequest = await prisma.resourceRequest.create({
      data: {
        eventId,
        clubId: body.clubId,
        requestedById: userId,
        title: body.title,
        description: body.description || null,
        category: body.category,
        amount: body.amount ? parseFloat(body.amount) : null,
        quantity: body.quantity ? parseInt(body.quantity) : null,
        priority: body.priority || "medium",
        status: "pending",
      },
      include: {
        club: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true, role: true } },
        event: { select: { id: true, title: true } },
      },
    });

    return success({
      resourceRequest,
      message: "Resource request created successfully!"
    });
  } catch (err) {
    console.error("[events:resources:POST]", err);
    return error("Internal server error", 500);
  }
}
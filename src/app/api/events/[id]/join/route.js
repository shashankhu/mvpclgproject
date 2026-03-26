// ─────────────────────────────────────────────
// POST /api/events/[id]/join — Club joins a standard event
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound, conflict } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function POST(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    if (!body.clubId) {
      return error("clubId is required");
    }

    // Verify event exists and is a standard event
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return notFound("Event not found");
    if (event.eventType !== "standard") {
      return error("Only standard events can be joined by clubs");
    }

    // Verify user is a member/head of the club
    const membership = await prisma.clubMember.findUnique({
      where: {
        userId_clubId: {
          userId: decoded.userId,
          clubId: body.clubId,
        },
      },
    });
    if (!membership) return forbidden("You are not a member of this club");

    // Check if already joined
    const existing = await prisma.eventParticipant.findUnique({
      where: {
        eventId_clubId: {
          eventId: id,
          clubId: body.clubId,
        },
      },
    });
    if (existing) return conflict("This club has already joined this event");

    const participant = await prisma.eventParticipant.create({
      data: {
        eventId: id,
        clubId: body.clubId,
      },
      include: {
        club: { select: { id: true, name: true } },
        event: { select: { id: true, title: true } },
      },
    });

    return success({ participant, message: "Club joined the event" }, 201);
  } catch (err) {
    console.error("[events:join]", err);
    return error("Internal server error", 500);
  }
}

// ─────────────────────────────────────────────
// PATCH /api/resource-requests/[id] — Review resource request (approve/reject)
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, validateRequired } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function PATCH(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id: requestId } = await params;
    const { role, userId } = decoded;
    const body = await request.json();

    // Validate required fields
    const validationError = validateRequired(body, ["action"]);
    if (validationError) return error(validationError);

    const { action, comment } = body;

    if (!["approved", "rejected", "fulfilled"].includes(action)) {
      return error("Invalid action. Must be 'approved', 'rejected', or 'fulfilled'");
    }

    // Get the resource request
    const resourceRequest = await prisma.resourceRequest.findUnique({
      where: { id: requestId },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            status: true,
            parentEvent: { select: { id: true, title: true } }
          }
        },
        club: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
      },
    });

    if (!resourceRequest) {
      return error("Resource request not found", 404);
    }

    // Check permissions - only resource department can review requests
    const canReview = role === ROLES.RESOURCE || role === ROLES.ADMIN;
    if (!canReview) {
      return forbidden("Only resource department can review resource requests");
    }

    // Update the resource request
    const updatedRequest = await prisma.resourceRequest.update({
      where: { id: requestId },
      data: {
        status: action === "approved" ? "approved" : action === "rejected" ? "rejected" : "fulfilled",
        reviewedById: userId,
        reviewComment: comment || null,
        reviewedAt: new Date(),
      },
      include: {
        club: { select: { id: true, name: true } },
        requestedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true, role: true } },
        event: { select: { id: true, title: true } },
      },
    });

    // Create notification for the requester
    await prisma.notification.create({
      data: {
        userId: resourceRequest.requestedById,
        eventId: resourceRequest.eventId,
        type: action === "approved" ? "resource_approved" : action === "rejected" ? "resource_rejected" : "resource_fulfilled",
        title: `Resource Request ${action.charAt(0).toUpperCase() + action.slice(1)}`,
        message: `Your resource request "${resourceRequest.title}" for event "${resourceRequest.event.title}" has been ${action}.${comment ? ` Comment: ${comment}` : ""}`,
      },
    });

    return success({
      resourceRequest: updatedRequest,
      message: `Resource request ${action} successfully!`
    });
  } catch (err) {
    console.error("[resource-requests:PATCH]", err);
    return error("Internal server error", 500);
  }
}
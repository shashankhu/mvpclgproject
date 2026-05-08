// ─────────────────────────────────────────────
// POST /api/events/[id]/approve — Approve/Reject event
// Core approval engine endpoint
// ─────────────────────────────────────────────

import { authenticateStrict } from "@/lib/auth";
import { success, error, unauthorized, validateRequired } from "@/lib/api";
import { validateAndAddApproval } from "@/lib/approval";
import { APPROVAL_ACTION } from "@/lib/constants";

export async function POST(request, { params }) {
  try {
    const decoded = await authenticateStrict(request);
    if (!decoded) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const missing = validateRequired(body, ["action"]);
    if (missing) return error(missing);

    const validActions = Object.values(APPROVAL_ACTION);
    if (!validActions.includes(body.action)) {
      return error(
        `Invalid action. Must be one of: ${validActions.join(", ")}`
      );
    }

    // Rejection requires a comment
    if (body.action === APPROVAL_ACTION.REJECTED && !body.comment) {
      return error("A comment is required when rejecting an event");
    }

    // Department notifications (dean can specify which departments to notify)
    const deptNotifications = Array.isArray(body.notifyDepartments)
      ? body.notifyDepartments
      : [];

    // Delegate to approval engine
    const result = await validateAndAddApproval(
      id,
      decoded,
      body.action,
      body.comment || null,
      deptNotifications
    );

    if (!result.success) {
      return error(result.error, result.status);
    }

    return success({
      message: `Event ${body.action} successfully`,
      event: result.event,
      log: result.log,
    });
  } catch (err) {
    console.error("[events:approve]", err);
    return error("Internal server error", 500);
  }
}

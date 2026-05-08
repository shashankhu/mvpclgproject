// ─────────────────────────────────────────────
// POST /api/admin/impersonate
// Generate a JWT for another user without their password
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticateStrict, generateToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden, validateRequired } from "@/lib/api";
import { ROLES } from "@/lib/constants";

export async function POST(request) {
  try {
    const decoded = await authenticateStrict(request);
    if (!decoded) return unauthorized();

    if (decoded.role !== ROLES.SUPER_ADMIN && decoded.role !== ROLES.ADMIN) {
      return forbidden("Only administrators can impersonate other users");
    }

    const body = await request.json();

    const missing = validateRequired(body, ["targetUserId"]);
    if (missing) return error(missing);

    console.log("[admin:impersonate] Received targetUserId:", body.targetUserId, "type:", typeof body.targetUserId);

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { id: String(body.targetUserId).trim() },
    });

    if (!targetUser) {
      return error("Target user not found", 404);
    }

    if (!targetUser.isActive) {
      return error("Target account is deactivated", 403);
    }

    // Generate token for target user
    const token = generateToken(targetUser);

    return success({
      token,
      user: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        department: targetUser.department,
      },
      message: `Successfully switched to ${targetUser.name}'s account`,
    });
  } catch (err) {
    console.error("[admin:impersonate]", err);
    return error("Internal server error", 500);
  }
}

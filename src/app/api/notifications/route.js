// ─────────────────────────────────────────────
// GET   /api/notifications — User's notifications
// PATCH /api/notifications — Mark as read
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/api";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");
    const safeLimit = Math.min(limit, 100);

    const where = { userId: decoded.userId };
    if (unreadOnly) where.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: safeLimit,
        include: {
          event: { select: { id: true, title: true } },
        },
      }),
      prisma.notification.count({
        where: { userId: decoded.userId, isRead: false },
      }),
    ]);

    return success({ notifications, unreadCount });
  } catch (err) {
    console.error("[notifications:list]", err);
    return error("Internal server error", 500);
  }
}

export async function PATCH(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const body = await request.json();

    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: decoded.userId, isRead: false },
        data: { isRead: true },
      });
      return success({ message: "All notifications marked as read" });
    }

    if (body.notificationId) {
      const existing = await prisma.notification.findUnique({ where: { id: body.notificationId } });
      if (!existing) return error("Notification not found");
      if (existing.userId !== decoded.userId) return forbidden("You don't have access to this notification");

      await prisma.notification.update({
        where: { id: body.notificationId },
        data: { isRead: true },
      });
      return success({ message: "Notification marked as read" });
    }

    return error("Provide notificationId or markAllRead");
  } catch (err) {
    console.error("[notifications:markRead]", err);
    return error("Internal server error", 500);
  }
}

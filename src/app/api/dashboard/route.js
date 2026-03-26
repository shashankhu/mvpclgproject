// ─────────────────────────────────────────────
// GET /api/dashboard — Role-aware dashboard data
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/api";
import { ROLES, EVENT_STATUS } from "@/lib/constants";

export async function GET(request) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const role = decoded.role;
    const userId = decoded.userId;

    // ─── Common stats ───
    const [totalEvents, approvedEvents, pendingEvents, rejectedEvents] =
      await Promise.all([
        prisma.event.count(),
        prisma.event.count({ where: { status: EVENT_STATUS.APPROVED } }),
        prisma.event.count({
          where: {
            status: {
              in: [
                EVENT_STATUS.WAITING_FOR_FACULTY,
                EVENT_STATUS.WAITING_FOR_DEAN,
                EVENT_STATUS.WAITING_FOR_PRINCIPAL,
                EVENT_STATUS.WAITING_FOR_ADMIN,
              ],
            },
          },
        }),
        prisma.event.count({ where: { status: EVENT_STATUS.REJECTED } }),
      ]);

    let dashboardData = {
      stats: { totalEvents, approvedEvents, pendingEvents, rejectedEvents },
      recentEvents: [],
      pendingApprovals: [],
      myTasks: [],
      unreadNotifications: 0,
    };

    // ─── Unread notifications ───
    dashboardData.unreadNotifications = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    // ─── Role-specific data ───
    if (role === ROLES.STUDENT || role === ROLES.CLUB_HEAD) {
      // Get events created by user or their clubs
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { clubMemberships: { select: { clubId: true } } },
      });
      const clubIds = user?.clubMemberships.map((m) => m.clubId) || [];

      dashboardData.recentEvents = await prisma.event.findMany({
        where: {
          OR: [
            { createdById: userId },
            { clubId: { in: clubIds } },
            { eventType: "standard" },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          club: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
        },
      });

      dashboardData.myTasks = await prisma.task.findMany({
        where: { assigneeId: userId, status: { not: "completed" } },
        orderBy: { deadline: "asc" },
        take: 10,
        include: {
          event: { select: { id: true, title: true } },
        },
      });
    }

    if (
      role === ROLES.FACULTY_COORDINATOR ||
      role === ROLES.DEAN ||
      role === ROLES.PRINCIPAL ||
      role === ROLES.ADMIN
    ) {
      // Determine which status they need to act on
      const statusMap = {
        [ROLES.FACULTY_COORDINATOR]: EVENT_STATUS.WAITING_FOR_FACULTY,
        [ROLES.DEAN]: EVENT_STATUS.WAITING_FOR_DEAN,
        [ROLES.PRINCIPAL]: EVENT_STATUS.WAITING_FOR_PRINCIPAL,
        [ROLES.ADMIN]: EVENT_STATUS.WAITING_FOR_ADMIN,
      };

      const pendingStatus = statusMap[role];
      if (pendingStatus) {
        dashboardData.pendingApprovals = await prisma.event.findMany({
          where: { status: pendingStatus },
          orderBy: { createdAt: "asc" },
          include: {
            createdBy: { select: { name: true, role: true } },
            club: { select: { id: true, name: true } },
            approvalLogs: {
              orderBy: { createdAt: "asc" },
              include: {
                user: { select: { name: true, role: true } },
              },
            },
          },
        });
      }

      // Recent events for admin view
      dashboardData.recentEvents = await prisma.event.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          club: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
        },
      });
    }

    // Department roles
    if (
      [ROLES.TRANSPORT, ROLES.SECURITY, ROLES.RESOURCE, ROLES.FINANCE].includes(role)
    ) {
      // Show department notifications for this role
      const deptNotifs = await prisma.deptNotification.findMany({
        where: { departmentRole: role },
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          event: {
            select: { id: true, title: true, status: true, eventDate: true },
          },
        },
      });
      dashboardData.departmentAlerts = deptNotifs;

      dashboardData.recentEvents = await prisma.event.findMany({
        where: { status: EVENT_STATUS.APPROVED },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          club: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
        },
      });
    }

    return success(dashboardData);
  } catch (err) {
    console.error("[dashboard]", err);
    return error("Internal server error", 500);
  }
}

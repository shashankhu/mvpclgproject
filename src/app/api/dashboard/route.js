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

    // ─── Common stats (Optimized via single aggregation) ───
    const statusCounts = await prisma.event.groupBy({
      by: ['status'],
      _count: true,
    });

    let totalEvents = 0;
    let approvedEvents = 0;
    let pendingEvents = 0;
    let rejectedEvents = 0;

    const pendingStatuses = [
      EVENT_STATUS.WAITING_FOR_FACULTY,
      EVENT_STATUS.WAITING_FOR_DEAN,
      EVENT_STATUS.WAITING_FOR_PRINCIPAL,
      EVENT_STATUS.WAITING_FOR_ADMIN,
    ];

    statusCounts.forEach((group) => {
      const count = group._count;
      totalEvents += count;
      if (group.status === EVENT_STATUS.APPROVED) approvedEvents += count;
      else if (group.status === EVENT_STATUS.REJECTED) rejectedEvents += count;
      else if (pendingStatuses.includes(group.status)) pendingEvents += count;
    });

    let dashboardData = {
      stats: { totalEvents, approvedEvents, pendingEvents, rejectedEvents },
      recentEvents: [],
      pendingApprovals: [],
      myTasks: [],
      myClubs: [],           // Clubs user heads (for club_head role)
      coordinatedClubs: [],  // Clubs FC is responsible for (for FC role)
      unreadNotifications: 0,
    };

    // ─── Unread notifications ───
    dashboardData.unreadNotifications = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    // ─── Role-specific data ───
    if (role === ROLES.STUDENT || role === ROLES.CLUB_HEAD) {
      // Get user with their club memberships
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          clubMemberships: {
            include: {
              club: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  department: true,
                  facultyCoordinator: {
                    select: { id: true, name: true, email: true },
                  },
                },
              },
            },
          },
        },
      });

      const clubIds = user?.clubMemberships.map((m) => m.clubId) || [];

      // Get clubs where user is the head
      dashboardData.myClubs = user?.clubMemberships
        .filter((m) => m.role === "head")
        .map((m) => ({
          id: m.club.id,
          name: m.club.name,
          type: m.club.type,
          department: m.club.department,
          facultyCoordinator: m.club.facultyCoordinator,
          membershipRole: m.role,
        })) || [];

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

    if (role === ROLES.FACULTY_COORDINATOR) {
      // Get clubs this FC is responsible for
      const coordinatedClubs = await prisma.club.findMany({
        where: { facultyCoordinatorId: userId, isActive: true },
        select: {
          id: true,
          name: true,
          type: true,
          department: true,
          members: {
            where: { role: "head" },
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          _count: { select: { members: true, events: true } },
        },
      });

      dashboardData.coordinatedClubs = coordinatedClubs.map((club) => ({
        id: club.id,
        name: club.name,
        type: club.type,
        department: club.department,
        head: club.members[0]?.user || null,
        memberCount: club._count.members,
        eventCount: club._count.events,
      }));

      const coordinatedClubIds = coordinatedClubs.map((c) => c.id);

      // Only show pending approvals for events from FC's coordinated clubs
      dashboardData.pendingApprovals = await prisma.event.findMany({
        where: {
          status: EVENT_STATUS.WAITING_FOR_FACULTY,
          club: { facultyCoordinatorId: userId },
        },
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

      // Recent events from coordinated clubs
      dashboardData.recentEvents = await prisma.event.findMany({
        where: {
          OR: [
            { clubId: { in: coordinatedClubIds } },
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
    }

    if (role === ROLES.DEAN || role === ROLES.PRINCIPAL || role === ROLES.ADMIN) {
      // Determine which status they need to act on
      const statusMap = {
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

    // ─── Vendor Role Data ───
    if (role === ROLES.VENDOR) {
      const vendor = await prisma.vendor.findUnique({
        where: { userId },
        include: {
          _count: {
            select: {
              quotations: true,
              awardedQuotationRequests: true,
              vendorBills: true,
            }
          }
        }
      });
      
      if (vendor) {
        dashboardData.vendorProfile = {
          isVerified: vendor.isVerified,
          totalOrders: vendor.totalOrders,
          stats: {
            submissions: vendor._count.quotations,
            awards: vendor._count.awardedQuotationRequests,
            bills: vendor._count.vendorBills,
          }
        };

        // Open quotation requests matching their categories
        dashboardData.availableRequestsCount = await prisma.quotationRequest.count({
          where: {
            status: "open",
            category: { in: vendor.categories },
            deadline: { gt: new Date() }
          }
        });
        
        // Pending bills for this vendor
        dashboardData.pendingBillsCount = await prisma.vendorBill.count({
          where: {
             vendorId: vendor.id,
             status: { in: ["pending", "processing"] }
          }
        });
        
        // Let recent events reflect awarded quotation requests
        dashboardData.recentEvents = await prisma.quotationRequest.findMany({
          where: { awardedToId: vendor.id },
          take: 5,
          orderBy: { awardedAt: "desc" },
          include: { event: { select: { title: true, eventDate: true } } }
        });
      }
    }

    // ─── Finance Extra Data ───
    if (role === ROLES.FINANCE || role === ROLES.ADMIN || role === ROLES.DEAN) {
      dashboardData.financeStats = {
        pendingBills: await prisma.vendorBill.count({ where: { status: "pending" } }),
        processingBills: await prisma.vendorBill.count({ where: { status: "processing" } }),
      };
      
      // Also get recent Unverified vendors for DEAN/ADMIN
      if (role === ROLES.DEAN || role === ROLES.ADMIN) {
        dashboardData.unverifiedVendorsCount = await prisma.vendor.count({ where: { isVerified: false } });
      }
    }

    return success(dashboardData);
  } catch (err) {
    console.error("[dashboard]", err);
    return error("Internal server error", 500);
  }
}

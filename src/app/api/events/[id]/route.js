// ─────────────────────────────────────────────
// GET  /api/events/[id] — Event detail
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, notFound } from "@/lib/api";

export async function GET(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        club: {
          select: { id: true, name: true, description: true },
        },
        approvalLogs: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
        budget: true,
        expenses: {
          orderBy: { createdAt: "desc" },
          include: {
            addedBy: { select: { id: true, name: true } },
          },
        },
        tasks: {
          orderBy: { createdAt: "desc" },
          include: {
            assignee: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
        },
        participants: {
          include: {
            club: { select: { id: true, name: true } },
          },
        },
        deptNotifications: true,
      },
    });

    if (!event) return notFound("Event not found");

    // Add computed fields
    const totalExpenses = event.expenses.reduce((sum, e) => sum + e.amount, 0);
    const budgetRemaining = event.budget
      ? event.budget.totalAllocated - totalExpenses
      : 0;

    return success({
      event: {
        ...event,
        totalExpenses,
        budgetRemaining,
        budgetAllocated: event.budget?.totalAllocated || 0,
      },
    });
  } catch (err) {
    console.error("[events:detail]", err);
    return error("Internal server error", 500);
  }
}

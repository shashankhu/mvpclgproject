// ─────────────────────────────────────────────
// GET  /api/events/[id]/budget — Get budget & expenses
// POST /api/events/[id]/budget — Allocate budget
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import { success, error, unauthorized, forbidden, notFound } from "@/lib/api";
import { ROLES, EVENT_STATUS } from "@/lib/constants";

export async function GET(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        budget: true,
        expenses: {
          orderBy: { createdAt: "desc" },
          include: {
            addedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!event) return notFound("Event not found");

    const totalExpenses = event.expenses.reduce((sum, e) => sum + e.amount, 0);

    return success({
      budget: event.budget,
      expenses: event.expenses,
      totalAllocated: event.budget?.totalAllocated || 0,
      totalSpent: totalExpenses,
      remaining: (event.budget?.totalAllocated || 0) - totalExpenses,
      budgetEstimate: event.budgetEstimate,
    });
  } catch (err) {
    console.error("[budget:get]", err);
    return error("Internal server error", 500);
  }
}

export async function POST(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    // Only admin/finance can allocate budget
    if (decoded.role !== ROLES.ADMIN && decoded.role !== ROLES.FINANCE) {
      return forbidden("Only admin or finance can allocate budgets");
    }

    const { id } = await params;
    const body = await request.json();

    if (!body.totalAllocated || body.totalAllocated <= 0) {
      return error("totalAllocated must be a positive number");
    }

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return notFound("Event not found");

    if (event.status !== EVENT_STATUS.APPROVED && event.status !== EVENT_STATUS.IN_PROGRESS) {
      return error("Budget can only be allocated to approved events");
    }

    // Upsert budget
    const budget = await prisma.budget.upsert({
      where: { eventId: id },
      create: { eventId: id, totalAllocated: body.totalAllocated },
      update: { totalAllocated: body.totalAllocated },
    });

    return success({ budget, message: "Budget allocated" });
  } catch (err) {
    console.error("[budget:allocate]", err);
    return error("Internal server error", 500);
  }
}

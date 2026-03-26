// ─────────────────────────────────────────────
// GET  /api/events/[id]/expenses — List expenses
// POST /api/events/[id]/expenses — Add expense
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth";
import {
  success,
  error,
  unauthorized,
  notFound,
  validateRequired,
  validateEnum,
} from "@/lib/api";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

export async function GET(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;

    const expenses = await prisma.expense.findMany({
      where: { eventId: id },
      orderBy: { createdAt: "desc" },
      include: {
        addedBy: { select: { id: true, name: true } },
      },
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return success({ expenses, total });
  } catch (err) {
    console.error("[expenses:list]", err);
    return error("Internal server error", 500);
  }
}

export async function POST(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const missing = validateRequired(body, ["amount", "description", "category"]);
    if (missing) return error(missing);

    if (body.amount <= 0) {
      return error("Amount must be positive");
    }

    const catError = validateEnum(body.category, EXPENSE_CATEGORIES, "category");
    if (catError) return error(catError);

    // Check event exists
    const event = await prisma.event.findUnique({
      where: { id },
      include: { budget: true },
    });
    if (!event) return notFound("Event not found");

    // Check budget not exceeded
    if (event.budget) {
      const currentTotal = await prisma.expense.aggregate({
        where: { eventId: id },
        _sum: { amount: true },
      });
      const newTotal = (currentTotal._sum.amount || 0) + body.amount;
      if (newTotal > event.budget.totalAllocated) {
        return error(
          `Expense would exceed budget. Remaining: ₹${(event.budget.totalAllocated - (currentTotal._sum.amount || 0)).toFixed(2)}`
        );
      }
    }

    const expense = await prisma.expense.create({
      data: {
        eventId: id,
        amount: body.amount,
        description: body.description,
        category: body.category,
        proofUrl: body.proofUrl || null,
        addedById: decoded.userId,
      },
      include: {
        addedBy: { select: { id: true, name: true } },
      },
    });

    return success({ expense }, 201);
  } catch (err) {
    console.error("[expenses:add]", err);
    return error("Internal server error", 500);
  }
}

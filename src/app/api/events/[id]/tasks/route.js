// ─────────────────────────────────────────────
// GET   /api/events/[id]/tasks — List event tasks
// POST  /api/events/[id]/tasks — Create task
// PATCH /api/events/[id]/tasks — Update task
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
import { TASK_STATUS, TASK_PRIORITY } from "@/lib/constants";

export async function GET(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;

    const tasks = await prisma.task.findMany({
      where: { eventId: id },
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
      include: {
        assignee: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    const stats = {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === TASK_STATUS.PENDING).length,
      in_progress: tasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length,
      completed: tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length,
      delayed: tasks.filter((t) => t.status === TASK_STATUS.DELAYED).length,
    };

    return success({ tasks, stats });
  } catch (err) {
    console.error("[tasks:list]", err);
    return error("Internal server error", 500);
  }
}

export async function POST(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const { id } = await params;
    const body = await request.json();

    const missing = validateRequired(body, ["title"]);
    if (missing) return error(missing);

    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return notFound("Event not found");

    if (body.priority) {
      const priErr = validateEnum(body.priority, Object.values(TASK_PRIORITY), "priority");
      if (priErr) return error(priErr);
    }

    const task = await prisma.task.create({
      data: {
        eventId: id,
        title: body.title,
        description: body.description || null,
        priority: body.priority || TASK_PRIORITY.MEDIUM,
        deadline: body.deadline ? new Date(body.deadline) : null,
        assigneeId: body.assigneeId || null,
        createdById: decoded.userId,
      },
      include: {
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Notify assignee
    if (body.assigneeId && body.assigneeId !== decoded.userId) {
      await prisma.notification.create({
        data: {
          userId: body.assigneeId,
          eventId: id,
          type: "task_assigned",
          title: "New Task Assigned",
          message: `You've been assigned: "${body.title}" for event "${event.title}"`,
        },
      });
    }

    return success({ task }, 201);
  } catch (err) {
    console.error("[tasks:create]", err);
    return error("Internal server error", 500);
  }
}

export async function PATCH(request, { params }) {
  try {
    const decoded = authenticate(request);
    if (!decoded) return unauthorized();

    const body = await request.json();

    if (!body.taskId) {
      return error("taskId is required");
    }

    const task = await prisma.task.findUnique({
      where: { id: body.taskId },
    });
    if (!task) return notFound("Task not found");

    const updateData = {};
    if (body.status) {
      const statusErr = validateEnum(body.status, Object.values(TASK_STATUS), "status");
      if (statusErr) return error(statusErr);
      updateData.status = body.status;
      if (body.status === TASK_STATUS.COMPLETED) {
        updateData.completedAt = new Date();
      }
    }
    if (body.title) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.priority) updateData.priority = body.priority;
    if (body.deadline !== undefined) {
      updateData.deadline = body.deadline ? new Date(body.deadline) : null;
    }
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId;

    const updated = await prisma.task.update({
      where: { id: body.taskId },
      data: updateData,
      include: {
        assignee: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return success({ task: updated });
  } catch (err) {
    console.error("[tasks:update]", err);
    return error("Internal server error", 500);
  }
}

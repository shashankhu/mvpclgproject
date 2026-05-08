// ─────────────────────────────────────────────
// Diganta — Approval Engine
// Event-sourcing-lite: immutable logs → derive state
// Conditional routing: budget > ₹50K → Principal + Admin
// ─────────────────────────────────────────────

import prisma from "@/lib/prisma";
import {
  EVENT_STATUS,
  APPROVAL_ACTION,
  APPROVAL_CHAIN,
  getRequiredStages,
  getSubEventRequiredStages,
  DEPARTMENT_ROLES,
} from "@/lib/constants";

// ─── Derive Status from Logs ───

/**
 * Determines the current event status by inspecting approval logs.
 * This is the source-of-truth derivation — the cached `status` field
 * on the Event is just a performance mirror.
 *
 * @param {object} event - Event with budgetEstimate and parentEventId
 * @param {Array} approvalLogs - Ordered by createdAt
 * @returns {string} The derived EVENT_STATUS
 */
export function deriveEventStatus(event, approvalLogs) {
  // Sub-events (with parentEventId) skip faculty coordinator stage
  const isSubEvent = !!event.parentEventId;
  const requiredStages = isSubEvent
    ? getSubEventRequiredStages(event)
    : getRequiredStages(event);

  // Check each required stage in order
  for (const stage of requiredStages) {
    // Get the latest log for this stage
    const stageLogs = approvalLogs
      .filter((log) => log.stage === stage)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const latestLog = stageLogs[0];

    if (!latestLog) {
      // No action at this stage yet — waiting here
      return stageToWaitingStatus(stage);
    }

    if (latestLog.action === APPROVAL_ACTION.REJECTED) {
      return EVENT_STATUS.REJECTED;
    }

    if (latestLog.action === APPROVAL_ACTION.REVISION_REQUESTED) {
      return EVENT_STATUS.DRAFT; // sent back for revision
    }

    // If approved, continue to next stage
  }

  // All required stages approved
  return EVENT_STATUS.APPROVED;
}

// ─── Validate & Add Approval (Transaction-safe) ───

/**
 * Core approval action — validates stage ordering, role permissions,
 * and records the approval log within a transaction.
 *
 * @param {string} eventId
 * @param {object} user - { userId, role, name }
 * @param {string} action - "approved" | "rejected" | "revision_requested"
 * @param {string|null} comment
 * @param {string[]} deptNotifications - department roles to notify (dean only)
 * @returns {{ success: boolean, event: object, log: object, error?: string }}
 */
export async function validateAndAddApproval(
  eventId,
  user,
  action,
  comment = null,
  deptNotifications = []
) {
  // ─── Execute entire validation within transaction to prevent race conditions ───
  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch event with all logs and club info (INSIDE TRANSACTION)
    const event = await tx.event.findUnique({
      where: { id: eventId },
      include: {
        approvalLogs: {
          orderBy: { createdAt: "asc" },
          include: { user: { select: { name: true, role: true } } },
        },
        club: {
          select: {
            id: true,
            facultyCoordinatorId: true,
            facultyCoordinator: { select: { id: true, name: true } }
          },
        },
        parentEvent: {
          select: { id: true, title: true },
        },
      },
    });

    if (!event) {
      return { success: false, error: "Event not found", status: 404 };
    }

    // Check event is in a reviewable state
    if (
      event.status === EVENT_STATUS.APPROVED ||
      event.status === EVENT_STATUS.REJECTED
    ) {
      return {
        success: false,
        error: "Event has already been finalized",
        status: 409,
      };
    }

    if (event.status === EVENT_STATUS.DRAFT) {
      return {
        success: false,
        error: "Event has not been submitted for approval",
        status: 400,
      };
    }

    // Determine which stage we're at
    // Sub-events (with parentEventId) skip faculty coordinator stage
    const isSubEvent = !!event.parentEventId;
    const requiredStages = isSubEvent
      ? getSubEventRequiredStages(event)
      : getRequiredStages(event);
    const currentStage = getCurrentStage(event, event.approvalLogs, requiredStages);

    if (!currentStage) {
      return {
        success: false,
        error: "No pending approval stage found",
        status: 409,
      };
    }

    // Validate: user's role must match the current stage
    const stageConfig = APPROVAL_CHAIN.find((s) => s.stage === currentStage);
    if (!stageConfig || user.role !== stageConfig.role) {
      return {
        success: false,
        error: `This event is waiting for ${currentStage.replace("_", " ")} approval. Your role (${user.role}) cannot act at this stage.`,
        status: 403,
      };
    }

    // For faculty_coordinator stage, validate that this FC is the assigned coordinator for the club
    if (currentStage === "faculty_coordinator" && event.club) {
      if (event.club.facultyCoordinatorId !== user.userId) {
        return {
          success: false,
          error: "You are not the assigned faculty coordinator for this club. Only the assigned coordinator can approve this event.",
          status: 403,
        };
      }
    }

    // Check for duplicate: same user already acted at this stage
    const existingLog = event.approvalLogs.find(
      (log) => log.stage === currentStage && log.userId === user.userId
    );
    if (existingLog) {
      return {
        success: false,
        error: "You have already reviewed this event at this stage",
        status: 409,
      };
    }

    // 2. Create immutable approval log
    const log = await tx.approvalLog.create({
      data: {
        eventId,
        userId: user.userId,
        role: user.role,
        action,
        comment,
        stage: currentStage,
      },
    });

    // Compute new cached status
    const allLogs = [...event.approvalLogs, log];
    const newStatus = deriveEventStatus(event, allLogs);

    // Update cached status on event
    const updatedEvent = await tx.event.update({
      where: { id: eventId },
      data: { status: newStatus },
    });

    // ─── Department Notifications (Dean's intent) ───
    if (
      action === APPROVAL_ACTION.APPROVED &&
      currentStage === "dean" &&
      deptNotifications.length > 0
    ) {
      const validDepts = deptNotifications.filter((d) =>
        DEPARTMENT_ROLES.includes(d)
      );

      if (validDepts.length > 0) {
        // Create DeptNotification records
        await tx.deptNotification.createMany({
          data: validDepts.map((dept) => ({
            eventId,
            departmentRole: dept,
            message: comment || `Event "${event.title}" approved — action required`,
          })),
        });

        // Notify department users
        const deptUsers = await tx.user.findMany({
          where: { role: { in: validDepts }, isActive: true },
          select: { id: true },
        });

        if (deptUsers.length > 0) {
          await tx.notification.createMany({
            data: deptUsers.map((u) => ({
              userId: u.id,
              eventId,
              type: "dept_alert",
              title: "Action Required",
              message: `Event "${event.title}" has been approved. Your department has been notified for execution.`,
            })),
          });
        }
      }
    }

    // ─── Notify next approver ───
    if (newStatus !== EVENT_STATUS.APPROVED && newStatus !== EVENT_STATUS.REJECTED) {
      const nextStage = getCurrentStage(event, allLogs, requiredStages);
      if (nextStage) {
        const nextStageConfig = APPROVAL_CHAIN.find((s) => s.stage === nextStage);
        if (nextStageConfig) {
          let nextApprovers = [];

          // For faculty_coordinator stage, notify only the assigned FC for the club
          if (nextStage === "faculty_coordinator" && event.club?.facultyCoordinatorId) {
            nextApprovers = [{ id: event.club.facultyCoordinatorId }];
          } else {
            // For other stages, notify all users with that role
            nextApprovers = await tx.user.findMany({
              where: { role: nextStageConfig.role, isActive: true },
              select: { id: true },
            });
          }

          if (nextApprovers.length > 0) {
            await tx.notification.createMany({
              data: nextApprovers.map((u) => ({
                userId: u.id,
                eventId,
                type: "approval_required",
                title: "Approval Required",
                message: `Event "${event.title}" is waiting for your review.`,
              })),
            });
          }
        }
      }
    }

    // ─── Notify event creator on final decision ───
    if (
      newStatus === EVENT_STATUS.APPROVED ||
      newStatus === EVENT_STATUS.REJECTED
    ) {
      await tx.notification.create({
        data: {
          userId: event.createdById,
          eventId,
          type:
            newStatus === EVENT_STATUS.APPROVED
              ? "event_approved"
              : "event_rejected",
          title:
            newStatus === EVENT_STATUS.APPROVED
              ? "Event Approved!"
              : "Event Rejected",
          message:
            newStatus === EVENT_STATUS.APPROVED
              ? `Your event "${event.title}" has been fully approved!`
              : `Your event "${event.title}" has been rejected. ${comment || ""}`,
        },
      });
    }

    return { log, event: updatedEvent };
  }); // end of transaction block

  // If the transaction returned an error object directly (validation failed inside tx)
  if (result.error) {
    return result;
  }

  return {
    success: true,
    event: result.event,
    log: result.log,
  };
}

// ─── Helpers ───

function getCurrentStage(event, approvalLogs, requiredStages) {
  for (const stage of requiredStages) {
    const stageLogs = approvalLogs
      .filter((log) => log.stage === stage)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const latestLog = stageLogs[0];

    if (!latestLog) {
      return stage; // this stage needs action
    }

    if (latestLog.action === APPROVAL_ACTION.REJECTED) {
      return null; // already rejected, no more stages
    }

    if (latestLog.action === APPROVAL_ACTION.REVISION_REQUESTED) {
      return null; // sent back, no active stage
    }

    // Approved — move to next stage
  }

  return null; // all stages done
}

function stageToWaitingStatus(stage) {
  const map = {
    faculty_coordinator: EVENT_STATUS.WAITING_FOR_FACULTY,
    dean: EVENT_STATUS.WAITING_FOR_DEAN,
    principal: EVENT_STATUS.WAITING_FOR_PRINCIPAL,
    admin: EVENT_STATUS.WAITING_FOR_ADMIN,
  };
  return map[stage] || EVENT_STATUS.DRAFT;
}

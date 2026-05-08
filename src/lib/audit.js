// ─────────────────────────────────────────────
// Diganta — Audit Log Utility
// Immutable trail for all vendor/quotation actions
// ─────────────────────────────────────────────

/**
 * Create an immutable audit log entry within a transaction
 * @param {object} tx - Prisma transaction client
 * @param {object} params
 * @param {string} params.action - Action type (vendor_registered, quotation_submitted, etc.)
 * @param {string} params.entityType - Entity type (vendor, quotation_request, quotation, vendor_bill)
 * @param {string} params.entityId - ID of the entity
 * @param {string} params.userId - ID of the user performing the action
 * @param {object} [params.metadata] - Additional action-specific data (will be JSON stringified)
 */
export async function createAuditLog(tx, { action, entityType, entityId, userId, metadata }) {
  return tx.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

/**
 * Create an audit log entry without a transaction (standalone)
 * Use this only when not inside a transaction
 */
export async function createAuditLogStandalone(prisma, { action, entityType, entityId, userId, metadata }) {
  return prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// Audit action constants
export const AUDIT_ACTIONS = {
  VENDOR_REGISTERED: "vendor_registered",
  VENDOR_VERIFIED: "vendor_verified",
  VENDOR_REJECTED: "vendor_rejected",
  QUOTATION_REQUEST_CREATED: "quotation_request_created",
  QUOTATION_SUBMITTED: "quotation_submitted",
  QUOTATION_UPDATED: "quotation_updated",
  QUOTATION_WITHDRAWN: "quotation_withdrawn",
  VENDOR_AWARDED: "vendor_awarded",
  VENDOR_AWARD_REVOKED: "vendor_award_revoked",
  BILL_CREATED: "bill_created",
  PAYMENT_STATUS_CHANGED: "payment_status_changed",
  FILE_UPLOADED: "file_uploaded",
  FILE_DELETED: "file_deleted",
};

// Entity type constants
export const AUDIT_ENTITY_TYPES = {
  VENDOR: "vendor",
  QUOTATION_REQUEST: "quotation_request",
  QUOTATION: "quotation",
  VENDOR_BILL: "vendor_bill",
  ATTACHMENT: "attachment",
};

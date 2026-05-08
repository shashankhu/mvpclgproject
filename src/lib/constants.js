// ─────────────────────────────────────────────
// Diganta — Constants & Enums
// Single source of truth for all status values and roles
// ─────────────────────────────────────────────

export const ROLES = {
  STUDENT: "student",
  CLUB_HEAD: "club_head",
  FACULTY_COORDINATOR: "faculty_coordinator",
  DEAN: "dean",
  PRINCIPAL: "principal",
  ADMIN: "admin",
  TRANSPORT: "transport",
  SECURITY: "security",
  RESOURCE: "resource",
  FINANCE: "finance",
  VENDOR: "vendor",
};

// All valid roles for validation
export const ALL_ROLES = Object.values(ROLES);

// Roles that can approve events
export const APPROVER_ROLES = [
  ROLES.FACULTY_COORDINATOR,
  ROLES.DEAN,
  ROLES.PRINCIPAL,
  ROLES.ADMIN,
];

// Department roles (notified upon approval)
export const DEPARTMENT_ROLES = [
  ROLES.TRANSPORT,
  ROLES.SECURITY,
  ROLES.RESOURCE,
  ROLES.FINANCE,
];

export const EVENT_STATUS = {
  DRAFT: "DRAFT",
  WAITING_FOR_FACULTY: "WAITING_FOR_FACULTY",
  WAITING_FOR_DEAN: "WAITING_FOR_DEAN",
  WAITING_FOR_PRINCIPAL: "WAITING_FOR_PRINCIPAL",
  WAITING_FOR_ADMIN: "WAITING_FOR_ADMIN",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  ARCHIVED: "ARCHIVED",
};

export const APPROVAL_ACTION = {
  APPROVED: "approved",
  REJECTED: "rejected",
  REVISION_REQUESTED: "revision_requested",
};

export const EVENT_TYPES = {
  TECH: "tech",
  CULTURAL: "cultural",
  SPORTS: "sports",
  WORKSHOP: "workshop",
  SEMINAR: "seminar",
  STANDARD: "standard",
};

export const CLUB_TYPES = {
  DEPARTMENTAL: "departmental",
  NON_DEPARTMENTAL: "non_departmental",
};

export const ALL_CLUB_TYPES = Object.values(CLUB_TYPES);

export const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  DELAYED: "delayed",
};

export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
};

export const EXPENSE_CATEGORIES = [
  "venue",
  "catering",
  "equipment",
  "printing",
  "transport",
  "security",
  "other",
];

// ─────────────────────────────────────────────
// Approval Chain Configuration (Dynamic)
// ─────────────────────────────────────────────

// Budget threshold for requiring Principal + Admin approval
export const BUDGET_THRESHOLD = 50000;

// Ordered approval stages
export const APPROVAL_CHAIN = [
  {
    stage: "faculty_coordinator",
    role: ROLES.FACULTY_COORDINATOR,
    required: true, // always required
  },
  {
    stage: "dean",
    role: ROLES.DEAN,
    required: true, // always required
  },
  {
    stage: "principal",
    role: ROLES.PRINCIPAL,
    required: false, // only if budget > threshold
    condition: (event) => event.budgetEstimate > BUDGET_THRESHOLD,
  },
  {
    stage: "admin",
    role: ROLES.ADMIN,
    required: false, // only if budget > threshold
    condition: (event) => event.budgetEstimate > BUDGET_THRESHOLD,
  },
];

// Get the approval stages required for a specific event
export function getRequiredStages(event) {
  return APPROVAL_CHAIN.filter(
    (stage) => stage.required || (stage.condition && stage.condition(event))
  ).map((s) => s.stage);
}

// Get approval stages for sub-events (skip faculty coordinator, go directly to Dean)
export function getSubEventRequiredStages(event) {
  return APPROVAL_CHAIN.filter(
    (stage) => {
      // Skip faculty_coordinator for sub-events
      if (stage.stage === "faculty_coordinator") return false;
      return stage.required || (stage.condition && stage.condition(event));
    }
  ).map((s) => s.stage);
}

// Human-readable labels
export const STATUS_LABELS = {
  [EVENT_STATUS.DRAFT]: "Draft",
  [EVENT_STATUS.WAITING_FOR_FACULTY]: "Awaiting Faculty Review",
  [EVENT_STATUS.WAITING_FOR_DEAN]: "Awaiting Dean Review",
  [EVENT_STATUS.WAITING_FOR_PRINCIPAL]: "Awaiting Principal Review",
  [EVENT_STATUS.WAITING_FOR_ADMIN]: "Awaiting Admin Review",
  [EVENT_STATUS.APPROVED]: "Approved",
  [EVENT_STATUS.REJECTED]: "Rejected",
  [EVENT_STATUS.IN_PROGRESS]: "In Progress",
  [EVENT_STATUS.COMPLETED]: "Completed",
  [EVENT_STATUS.ARCHIVED]: "Archived",
};

// ─────────────────────────────────────────────
// Vendor Management Constants
// ─────────────────────────────────────────────

export const VENDOR_CATEGORIES = [
  "catering",
  "printing",
  "decoration",
  "sound_lighting",
  "transport",
  "photography",
  "stationery",
  "furniture",
  "it_equipment",
  "other",
];

export const VENDOR_CATEGORY_LABELS = {
  catering: "Catering & Food",
  printing: "Printing & Banners",
  decoration: "Decoration & Setup",
  sound_lighting: "Sound & Lighting",
  transport: "Transport & Logistics",
  photography: "Photography & Videography",
  stationery: "Stationery & Supplies",
  furniture: "Furniture & Equipment Rental",
  it_equipment: "IT Equipment",
  other: "Other Services",
};

export const QUOTATION_REQUEST_STATUS = {
  OPEN: "open",
  CLOSED: "closed",
  AWARDED: "awarded",
};

export const QUOTATION_STATUS = {
  SUBMITTED: "submitted",
  SUPERSEDED: "superseded",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
};

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  PAID: "paid",
  REJECTED: "rejected",
};

export const VENDOR_DOC_TYPES = [
  "gst_certificate",
  "pan_card",
  "registration",
  "portfolio",
  "other",
];

export const VENDOR_DOC_TYPE_LABELS = {
  gst_certificate: "GST Certificate",
  pan_card: "PAN Card",
  registration: "Registration Document",
  portfolio: "Portfolio / Catalog",
  other: "Other Document",
};

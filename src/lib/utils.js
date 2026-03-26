import { EVENT_STATUS } from "@/lib/constants";

export function getStatusBadgeClass(status) {
  const map = {
    [EVENT_STATUS.DRAFT]: "badge-draft",
    [EVENT_STATUS.WAITING_FOR_FACULTY]: "badge-pending",
    [EVENT_STATUS.WAITING_FOR_DEAN]: "badge-pending",
    [EVENT_STATUS.WAITING_FOR_PRINCIPAL]: "badge-pending",
    [EVENT_STATUS.WAITING_FOR_ADMIN]: "badge-pending",
    [EVENT_STATUS.APPROVED]: "badge-approved",
    [EVENT_STATUS.REJECTED]: "badge-rejected",
    [EVENT_STATUS.IN_PROGRESS]: "badge-progress",
    [EVENT_STATUS.COMPLETED]: "badge-approved",
    [EVENT_STATUS.ARCHIVED]: "badge-draft",
  };
  return map[status] || "badge-draft";
}

export function getStatusLabel(status) {
  const map = {
    DRAFT: "Draft",
    WAITING_FOR_FACULTY: "Awaiting Faculty",
    WAITING_FOR_DEAN: "Awaiting Dean",
    WAITING_FOR_PRINCIPAL: "Awaiting Principal",
    WAITING_FOR_ADMIN: "Awaiting Admin",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    ARCHIVED: "Archived",
  };
  return map[status] || status;
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

// Canonical customer_status_v2 metadata: ordered list, human labels, badge
// colors, and the onboarding-% derivation. Single source of truth so the list
// column, detail badge, dropdown, and progress bar never drift.

// Progression order NEW -> LIVE (indices 0..8). LIVE = 100%. The 4 terminal
// states below are NOT part of the linear progression.
export const STATUS_PROGRESSION = [
  "NEW",
  "WAITING_FOR_BUSINESS_INFO",
  "BUSINESS_INFO_SUBMITTED",
  "SETUP_IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "PENDING_REVIEW",
  "CONFIGURATION_COMPLETE",
  "AI_ACTIVATED",
  "LIVE",
];

export const TERMINAL_STATUSES = ["PAUSED", "CANCELLED", "SUPPORT_REQUIRED", "REJECTED"];

// All 13, in enum order — drives the status dropdown.
export const ALL_STATUSES = [...STATUS_PROGRESSION, ...TERMINAL_STATUSES];

// Human-friendly labels.
export const STATUS_LABEL = {
  NEW: "New",
  WAITING_FOR_BUSINESS_INFO: "Waiting for Business Info",
  BUSINESS_INFO_SUBMITTED: "Business Info Submitted",
  SETUP_IN_PROGRESS: "Setup In Progress",
  WAITING_FOR_CUSTOMER: "Waiting for Customer",
  PENDING_REVIEW: "Pending Review",
  CONFIGURATION_COMPLETE: "Configuration Complete",
  AI_ACTIVATED: "AI Activated",
  LIVE: "Live",
  PAUSED: "Paused",
  CANCELLED: "Cancelled",
  SUPPORT_REQUIRED: "Support Required",
  REJECTED: "Rejected",
};

// Tailwind color classes per status (badge bg + text).
export const STATUS_COLOR = {
  NEW: "bg-secondary text-muted-foreground",
  WAITING_FOR_BUSINESS_INFO: "bg-amber-50 text-amber-700",
  BUSINESS_INFO_SUBMITTED: "bg-brand-50 text-brand-700",
  SETUP_IN_PROGRESS: "bg-brand-50 text-brand-700",
  WAITING_FOR_CUSTOMER: "bg-amber-50 text-amber-700",
  PENDING_REVIEW: "bg-violet-50 text-violet-700",
  CONFIGURATION_COMPLETE: "bg-emerald-50 text-emerald-700",
  AI_ACTIVATED: "bg-emerald-50 text-emerald-700",
  LIVE: "bg-emerald-100 text-emerald-800",
  PAUSED: "bg-secondary text-muted-foreground",
  CANCELLED: "bg-red-50 text-red-700",
  SUPPORT_REQUIRED: "bg-orange-50 text-orange-700",
  REJECTED: "bg-red-50 text-red-700",
};

export function statusLabel(status) {
  return STATUS_LABEL[status] ?? status ?? "—";
}

// Onboarding %: position within the NEW->LIVE progression. Terminal statuses
// return null (caller renders the badge label instead of a bar/percentage).
export function onboardingPercent(status) {
  if (TERMINAL_STATUSES.includes(status)) return null;
  const idx = STATUS_PROGRESSION.indexOf(status);
  if (idx < 0) return null;
  return Math.round((idx / (STATUS_PROGRESSION.length - 1)) * 100);
}

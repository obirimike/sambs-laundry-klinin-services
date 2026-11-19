export type AssignmentStatusValue =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED_FOR_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED";

export type SupervisionStatusValue =
  | "NOT_REQUIRED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "AWAITING_SUPERVISOR_REVIEW"
  | "CHANGES_REQUESTED"
  | "SUPERVISOR_APPROVED"
  | "RETURNED_BY_ADMIN";

export function formatAssignmentStatus(status: string): {
  label: string;
  tone: string;
} {
  switch (status) {
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        tone: "bg-blue-50 text-blue-800 border-blue-200",
      };
    case "SUBMITTED_FOR_REVIEW":
      return {
        label: "Submitted for Review",
        tone: "bg-indigo-50 text-indigo-800 border-indigo-200",
      };
    case "CHANGES_REQUESTED":
      return {
        label: "Changes Requested",
        tone: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "APPROVED":
      return {
        label: "Supervisor Approved",
        tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case "PENDING":
    default:
      return {
        label: "Pending Start",
        tone: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

export function formatSupervisionStatus(status: string): {
  label: string;
  tone: string;
} {
  switch (status) {
    case "ASSIGNED":
      return {
        label: "Supervisor Assigned",
        tone: "bg-slate-100 text-slate-700 border-slate-200",
      };
    case "IN_PROGRESS":
      return {
        label: "Work in Progress",
        tone: "bg-blue-50 text-blue-800 border-blue-200",
      };
    case "AWAITING_SUPERVISOR_REVIEW":
      return {
        label: "Awaiting Supervisor Review",
        tone: "bg-indigo-50 text-indigo-800 border-indigo-200",
      };
    case "CHANGES_REQUESTED":
      return {
        label: "Corrections Requested",
        tone: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "SUPERVISOR_APPROVED":
      return {
        label: "Awaiting Admin Final Approval",
        tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case "RETURNED_BY_ADMIN":
      return {
        label: "Returned by Admin",
        tone: "bg-rose-50 text-rose-800 border-rose-200",
      };
    case "NOT_REQUIRED":
    default:
      return {
        label: "Not Assigned",
        tone: "bg-slate-100 text-slate-600 border-slate-200",
      };
  }
}

export function formatBookingStatus(status: string): {
  label: string;
  tone: string;
} {
  switch (status) {
    case "CONFIRMED":
      return {
        label: "Confirmed",
        tone: "bg-blue-50 text-blue-800 border-blue-200",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        tone: "bg-indigo-50 text-indigo-800 border-indigo-200",
      };
    case "COMPLETED":
      return {
        label: "Completed",
        tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        tone: "bg-rose-50 text-rose-800 border-rose-200",
      };
    case "PENDING":
    default:
      return {
        label: "Pending",
        tone: "bg-amber-50 text-amber-800 border-amber-200",
      };
  }
}

export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "TM";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

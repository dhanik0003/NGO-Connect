import { formatDistanceToNow } from "date-fns";
import type { ApiReport, ApiStatusHistory } from "@/services/api";

export type UiSeverity = "low" | "medium" | "high" | "critical";
export type UiStatus =
  | "submitted"
  | "classified"
  | "routed"
  | "accepted"
  | "assigned"
  | "in_progress"
  | "on_the_way"
  | "completed"
  | "verified"
  | "rejected"
  | "pending";

const statusMap: Record<string, UiStatus> = {
  SUBMITTED: "submitted",
  UNDER_REVIEW: "pending",
  CLASSIFIED: "classified",
  DUPLICATE_FLAGGED: "classified",
  ROUTED_TO_NGO: "routed",
  PENDING_NGO_ACCEPTANCE: "pending",
  ACCEPTED_BY_NGO: "accepted",
  ACCEPTED: "accepted",
  REJECTED_BY_NGO: "rejected",
  REJECTED: "rejected",
  REASSIGNMENT_PENDING: "pending",
  REASSIGNMENT_NEEDED: "pending",
  VOLUNTEER_ASSIGNED: "assigned",
  ASSIGNED: "assigned",
  VOLUNTEER_REJECTED: "rejected",
  ON_THE_WAY: "on_the_way",
  IN_PROGRESS: "in_progress",
  COMPLETED_PENDING_VERIFICATION: "completed",
  VERIFIED_CLOSED: "verified",
  REWORK_NEEDED: "pending",
  INVALID: "rejected",
  ESCALATED: "pending",
  DUPLICATE_MERGED: "rejected",
};

const priorityMap: Record<string, UiSeverity> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

export const toSeverity = (value?: string | null): UiSeverity => priorityMap[value ?? ""] ?? "medium";

export const toStatus = (value?: string | null): UiStatus => statusMap[value ?? ""] ?? "pending";

export const formatStatusLabel = (value?: string | null) =>
  (value ?? "pending")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const formatRelativeTime = (value?: string | null) => {
  if (!value) {
    return "just now";
  }

  return formatDistanceToNow(new Date(value), { addSuffix: true });
};

export const buildTimelineSteps = (history?: ApiStatusHistory[]) => {
  if (!history || history.length === 0) {
    return [
      { label: "Submitted", status: "active" as const },
      { label: "Classified", status: "pending" as const },
      { label: "Routed", status: "pending" as const },
      { label: "Verified Closed", status: "pending" as const },
    ];
  }

  return history.map((entry, index) => ({
    label: formatStatusLabel(entry.newStatus),
    description: entry.note ?? undefined,
    timestamp: formatRelativeTime(entry.createdAt),
    status: index < history.length - 1 ? ("done" as const) : ("active" as const),
  }));
};

export const toReportCard = (report: ApiReport) => ({
  id: report.id,
  title: report.title,
  category: report.aiPredictedCategory?.name ?? report.originalCategory?.name ?? "Uncategorized",
  severity: toSeverity(report.priorityLabel),
  status: toStatus(report.status),
  location: report.address,
  lat: report.latitude,
  lng: report.longitude,
  reporter: report.reporterUserId,
  createdAt: formatRelativeTime(report.createdAt),
});

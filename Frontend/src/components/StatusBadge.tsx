import { cn } from "@/lib/utils";
import { formatStatusLabel, toStatus, type UiSeverity, type UiStatus } from "@/lib/platform";

export type Severity = UiSeverity;
export type Status = UiStatus;

const severityStyles: Record<Severity, string> = {
  low: "bg-success/15 text-success border-success/30",
  medium: "bg-warning/20 text-warning-foreground border-warning/40",
  high: "bg-danger/15 text-danger border-danger/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
};

const statusStyles: Record<Status, string> = {
  submitted: "bg-muted text-muted-foreground border-border",
  classified: "bg-info/15 text-info border-info/30",
  routed: "bg-info/15 text-info border-info/30",
  accepted: "bg-primary/10 text-primary border-primary/30",
  assigned: "bg-primary/10 text-primary border-primary/30",
  on_the_way: "bg-warning/20 text-warning-foreground border-warning/40",
  in_progress: "bg-warning/20 text-warning-foreground border-warning/40",
  completed: "bg-success/15 text-success border-success/30",
  verified: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  pending: "bg-muted text-muted-foreground border-border",
};

export function SeverityBadge({ level, className }: { level: Severity; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        severityStyles[level],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {level}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: Status | string; className?: string }) {
  const normalized = toStatus(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusStyles[normalized],
        className,
      )}
    >
      {formatStatusLabel(status)}
    </span>
  );
}

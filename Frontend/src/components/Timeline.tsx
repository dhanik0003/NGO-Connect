import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineStep {
  label: string;
  description?: string;
  timestamp?: string;
  status: "done" | "active" | "pending";
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <ol className="relative space-y-6">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                step.status === "done" && "border-success bg-success text-success-foreground",
                step.status === "active" && "border-primary bg-primary text-primary-foreground animate-pulse",
                step.status === "pending" && "border-border bg-background text-muted-foreground",
              )}
            >
              {step.status === "done" ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mt-1 w-0.5 flex-1 min-h-8",
                  step.status === "done" ? "bg-success/40" : "bg-border",
                )}
              />
            )}
          </div>
          <div className="flex-1 pb-6">
            <p className={cn("font-medium", step.status === "pending" && "text-muted-foreground")}>
              {step.label}
            </p>
            {step.description && <p className="text-sm text-muted-foreground">{step.description}</p>}
            {step.timestamp && <p className="text-xs text-muted-foreground mt-1">{step.timestamp}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

import { Card, CardContent } from "@/components/ui/card";
import { AnimatedMetric } from "@/components/AnimatedMetric";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  tone?: "primary" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const toneStyles: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/20 text-warning-foreground",
  danger: "bg-danger/15 text-danger",
  info: "bg-info/15 text-info",
};

export function StatCard({ label, value, icon: Icon, trend, tone = "primary", className }: Props) {
  return (
    <Card className={cn("border-border/60 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elegant)] transition-shadow", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <AnimatedMetric value={value} className="mt-2 text-3xl font-semibold tracking-tight" />
            {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
          </div>
          <div className={cn("rounded-lg p-2.5", toneStyles[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

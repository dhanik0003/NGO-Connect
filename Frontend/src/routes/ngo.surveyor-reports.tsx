import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/StatusBadge";
import { ClipboardCheck } from "lucide-react";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";
import { toSeverity } from "@/lib/platform";

export const Route = createFileRoute("/ngo/surveyor-reports")({
  component: NgoSurveyorReports,
});

function NgoSurveyorReports() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const tasksQuery = useQuery({
    queryKey: ["ngo", "tasks", accessToken],
    queryFn: () => apiClient.getNgoTasks(accessToken!),
    enabled: Boolean(accessToken),
  });

  const surveyorTasks = (tasksQuery.data ?? []).filter(
    (task) => task.masterReport?.reporterRole === "SURVEYOR",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Surveyor reports</h1>
        <p className="text-sm text-muted-foreground">Field-verified submissions routed into your NGO workspace.</p>
      </div>
      <div className="grid gap-3">
        {surveyorTasks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No surveyor-origin reports have reached this NGO yet.
            </CardContent>
          </Card>
        ) : (
          surveyorTasks.map((task) => (
            <Card key={task.id}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-info/15 text-info flex items-center justify-center"><ClipboardCheck className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.id} · {task.address}</p>
                </div>
                <SeverityBadge level={toSeverity(task.priorityLabel)} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

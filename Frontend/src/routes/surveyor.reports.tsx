import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadge";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";
import { formatRelativeTime, toSeverity } from "@/lib/platform";

export const Route = createFileRoute("/surveyor/reports")({
  component: SurveyorReports,
});

function SurveyorReports() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const reportsQuery = useQuery({
    queryKey: ["surveyor", "reports", accessToken],
    queryFn: () => apiClient.getSurveyorReports(accessToken!),
    enabled: Boolean(accessToken),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My reports</h1>
        <p className="text-sm text-muted-foreground">Track every field submission and its routing outcome.</p>
      </div>
      <Card>
        <CardContent className="p-0 divide-y">
          {(reportsQuery.data ?? []).length === 0 ? (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No reports submitted yet.
            </div>
          ) : (
            reportsQuery.data?.map((report) => (
              <div key={report.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{report.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.aiPredictedCategory?.name ?? report.originalCategory?.name ?? "Uncategorized"} · {report.address} · {formatRelativeTime(report.createdAt)}
                  </p>
                </div>
                <SeverityBadge level={toSeverity(report.priorityLabel)} />
                <StatusBadge status={report.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadge";
import { ChevronRight } from "lucide-react";
import { apiClient } from "@/services/api";
import { toReportCard } from "@/lib/platform";
import { useSessionStore } from "@/store/session";

export const Route = createFileRoute("/user/reports")({
  component: UserReports,
});

function UserReports() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const reportsQuery = useQuery({
    queryKey: ["reports", "my", accessToken],
    queryFn: () => apiClient.getMyReports(accessToken!),
    enabled: Boolean(accessToken),
  });

  const list = reportsQuery.data?.map(toReportCard) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My reports</h1>
      </div>
      <Card>
        <CardContent className="p-0 divide-y">
          {list.length === 0 ? (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No reports submitted yet.
            </div>
          ) : (
            list.map((report) => (
              <Link key={report.id} to="/user/reports/$id" params={{ id: report.id }} className="px-6 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{report.title}</p>
                  <p className="text-xs text-muted-foreground">{report.id} · {report.location} · {report.createdAt}</p>
                </div>
                <SeverityBadge level={report.severity} />
                <StatusBadge status={report.status} />
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

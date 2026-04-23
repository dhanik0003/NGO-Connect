import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";

export const Route = createFileRoute("/surveyor/routing")({
  component: SurveyorRouting,
});

function SurveyorRouting() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const dashboardQuery = useQuery({
    queryKey: ["surveyor", "dashboard", accessToken],
    queryFn: () => apiClient.getSurveyorDashboard(accessToken!),
    enabled: Boolean(accessToken),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Direct vs Central routing</h1>
        <p className="text-sm text-muted-foreground">See which reports went to your NGO and which stayed in the central queue.</p>
      </div>
      <div className="grid gap-3">
        {(dashboardQuery.data?.reports ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No routing data yet.
            </CardContent>
          </Card>
        ) : (
          dashboardQuery.data?.reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{report.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.id} · {report.address}
                  </p>
                </div>
                <Badge variant={report.routedNgo ? "default" : "secondary"}>
                  {report.routedNgo ? `Routed to ${report.routedNgo.name}` : "Central queue"}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

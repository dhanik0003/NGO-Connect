import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapView } from "@/components/MapView";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";
import { toSeverity } from "@/lib/platform";

export const Route = createFileRoute("/surveyor/region")({
  component: SurveyorRegion,
});

function SurveyorRegion() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const dashboardQuery = useQuery({
    queryKey: ["surveyor", "dashboard", accessToken],
    queryFn: () => apiClient.getSurveyorDashboard(accessToken!),
    enabled: Boolean(accessToken),
  });

  const markers = (dashboardQuery.data?.reports ?? []).map((report) => ({
    id: report.id,
    lat: report.latitude,
    lng: report.longitude,
    label: report.title,
    tone: toSeverity(report.priorityLabel) === "critical" ? ("danger" as const) : ("primary" as const),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Region map</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Your assigned region</CardTitle></CardHeader>
        <CardContent>
          <MapView
            height="h-[500px]"
            center={
              dashboardQuery.data?.surveyor
                ? [dashboardQuery.data.surveyor.latitude, dashboardQuery.data.surveyor.longitude]
                : undefined
            }
            markers={markers}
          />
        </CardContent>
      </Card>
    </div>
  );
}

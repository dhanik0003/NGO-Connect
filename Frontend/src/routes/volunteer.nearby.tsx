import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapView } from "@/components/MapView";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";
import { toSeverity } from "@/lib/platform";

export const Route = createFileRoute("/volunteer/nearby")({
  component: VolunteerNearby,
});

function VolunteerNearby() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const tasksQuery = useQuery({
    queryKey: ["volunteer", "tasks", accessToken],
    queryFn: () => apiClient.getVolunteerTasks(accessToken!),
    enabled: Boolean(accessToken),
  });

  const markers = (tasksQuery.data ?? []).map((task) => ({
    id: task.id,
    lat: task.latitude,
    lng: task.longitude,
    label: task.title,
    tone: toSeverity(task.priorityLabel) === "critical" ? ("danger" as const) : ("primary" as const),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nearby tasks</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Assigned task map</CardTitle></CardHeader>
        <CardContent>
          <MapView height="h-[500px]" markers={markers} />
        </CardContent>
      </Card>
    </div>
  );
}

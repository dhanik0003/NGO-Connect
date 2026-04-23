import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapView } from "@/components/MapView";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";

export const Route = createFileRoute("/ngo/availability")({
  component: NgoAvailability,
});

function NgoAvailability() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const volunteersQuery = useQuery({
    queryKey: ["ngo", "volunteers", accessToken],
    queryFn: () => apiClient.getNgoVolunteers(accessToken!),
    enabled: Boolean(accessToken),
  });

  const markers = (volunteersQuery.data ?? []).map((volunteer) => ({
    id: volunteer.id,
    lat: volunteer.latitude,
    lng: volunteer.longitude,
    label: `${volunteer.user?.fullName ?? "Volunteer"} - ${volunteer.availabilityStatus.toLowerCase()}`,
    tone: volunteer.availabilityStatus === "AVAILABLE" ? ("success" as const) : ("warning" as const),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Volunteer availability</h1>
        <p className="text-sm text-muted-foreground">Live proximity and availability for your real volunteer pool.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Live map</CardTitle></CardHeader>
        <CardContent>
          <MapView height="h-[500px]" markers={markers} />
        </CardContent>
      </Card>
    </div>
  );
}

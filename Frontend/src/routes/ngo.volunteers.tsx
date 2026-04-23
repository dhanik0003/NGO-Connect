import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";

export const Route = createFileRoute("/ngo/volunteers")({
  component: NgoVolunteers,
});

function NgoVolunteers() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const volunteersQuery = useQuery({
    queryKey: ["ngo", "volunteers", accessToken],
    queryFn: () => apiClient.getNgoVolunteers(accessToken!),
    enabled: Boolean(accessToken),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Volunteers</h1>
        <p className="text-sm text-muted-foreground">Your actual assignment pool appears here.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(volunteersQuery.data ?? []).length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No volunteers are registered under this NGO yet.
            </CardContent>
          </Card>
        ) : (
          volunteersQuery.data?.map((volunteer) => (
            <Card key={volunteer.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {(volunteer.user?.fullName ?? "V")
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{volunteer.user?.fullName ?? "Volunteer"}</p>
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      {volunteer.rating ?? 0} - {volunteer.tasksCompleted ?? 0} done
                    </p>
                    {volunteer.ngo?.name ? (
                      <p className="text-xs text-muted-foreground mt-1">
                        Belongs to {volunteer.ngo.name}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={volunteer.availabilityStatus === "AVAILABLE" ? "default" : "secondary"}>
                    {volunteer.availabilityStatus.toLowerCase()}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(volunteer.skillsJson ?? []).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

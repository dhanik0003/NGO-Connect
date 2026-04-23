import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiClient, type ApiVolunteerDashboard } from "@/services/api";
import { useSessionStore } from "@/store/session";
import { toast } from "sonner";

export const Route = createFileRoute("/volunteer/availability")({
  component: VolunteerAvailability,
});

function VolunteerAvailability() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const dashboardKey = ["volunteer", "dashboard", accessToken] as const;
  const dashboardQuery = useQuery({
    queryKey: dashboardKey,
    queryFn: () => apiClient.getVolunteerDashboard(accessToken!),
    enabled: Boolean(accessToken),
  });

  const availabilityMutation = useMutation({
    mutationFn: async (available: boolean) =>
      apiClient.updateVolunteerAvailability(accessToken!, {
        availabilityStatus: available ? "AVAILABLE" : "UNAVAILABLE",
      }),
    onMutate: async (available) => {
      await queryClient.cancelQueries({ queryKey: dashboardKey });
      const previous = queryClient.getQueryData<ApiVolunteerDashboard>(dashboardKey);

      if (previous) {
        queryClient.setQueryData<ApiVolunteerDashboard>(dashboardKey, {
          ...previous,
          volunteer: {
            ...previous.volunteer,
            availabilityStatus: available ? "AVAILABLE" : "UNAVAILABLE",
          },
        });
      }

      return { previous };
    },
    onSuccess: async (profile, available) => {
      toast.success(available ? "You are available for new work." : "You are hidden from new assignments.");
      queryClient.setQueryData<ApiVolunteerDashboard>(dashboardKey, (current) =>
        current
          ? {
              ...current,
              volunteer: {
                ...current.volunteer,
                ...profile,
              },
            }
          : current,
      );
      await queryClient.invalidateQueries({ queryKey: dashboardKey });
      await queryClient.invalidateQueries({ queryKey: ["ngo", "volunteers"] });
    },
    onError: (error: Error, _available, context) => {
      if (context?.previous) {
        queryClient.setQueryData(dashboardKey, context.previous);
      }
      toast.error(error.message);
    },
  });

  const isAvailable = dashboardQuery.data?.volunteer.availabilityStatus === "AVAILABLE";

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Availability</h1>
        <p className="text-sm text-muted-foreground">Toggle this to receive or pause new task assignments.</p>
      </div>
      <Card>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <Label className="text-base">Available for tasks</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {isAvailable ? "NGO admins can assign new tasks to you." : "You are paused for new assignments."}
            </p>
          </div>
          <Switch
            checked={Boolean(isAvailable)}
            onCheckedChange={(checked) => availabilityMutation.mutate(checked)}
            disabled={availabilityMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}

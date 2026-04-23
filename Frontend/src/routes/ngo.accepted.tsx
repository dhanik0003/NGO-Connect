import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadge";
import { Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";
import { formatStatusLabel, toSeverity } from "@/lib/platform";
import { toast } from "sonner";

export const Route = createFileRoute("/ngo/accepted")({
  component: Accepted,
});

function Accepted() {
  const [selectedVolunteerIds, setSelectedVolunteerIds] = useState<Record<string, string[]>>({});
  const accessToken = useSessionStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ["ngo", "tasks", accessToken],
    queryFn: () => apiClient.getNgoTasks(accessToken!),
    enabled: Boolean(accessToken),
  });
  const volunteersQuery = useQuery({
    queryKey: ["ngo", "volunteers", accessToken],
    queryFn: () => apiClient.getNgoVolunteers(accessToken!),
    enabled: Boolean(accessToken),
  });

  const assignMutation = useMutation({
    mutationFn: async ({ taskId, volunteerIds }: { taskId: string; volunteerIds?: string[] }) =>
      apiClient.assignNgoTaskVolunteers(
        accessToken!,
        taskId,
        volunteerIds && volunteerIds.length > 1
          ? { volunteerIds }
          : volunteerIds && volunteerIds.length === 1
            ? { volunteerId: volunteerIds[0] }
            : {},
      ),
    onSuccess: async (_, variables) => {
      toast.success("Volunteer assignment updated.");
      setSelectedVolunteerIds((current) => ({
        ...current,
        [variables.taskId]: variables.volunteerIds ?? current[variables.taskId] ?? [],
      }));
      await queryClient.invalidateQueries({ queryKey: ["ngo", "tasks", accessToken] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const activeTasks = (tasksQuery.data ?? []).filter((task) =>
    ["ACCEPTED", "ASSIGNED", "IN_PROGRESS", "COMPLETED_PENDING_VERIFICATION", "REWORK_NEEDED", "REASSIGNMENT_NEEDED", "VOLUNTEER_REJECTED"].includes(task.status),
  );
  const availableVolunteers = (volunteersQuery.data ?? []).filter(
    (volunteer) => volunteer.availabilityStatus === "AVAILABLE",
  );

  const toggleVolunteer = (taskId: string, volunteerId: string, checked: boolean) => {
    setSelectedVolunteerIds((current) => {
      const next = new Set(current[taskId] ?? []);
      if (checked) {
        next.add(volunteerId);
      } else {
        next.delete(volunteerId);
      }
      return {
        ...current,
        [taskId]: Array.from(next),
      };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accepted tasks</h1>
        <p className="text-sm text-muted-foreground">Assign volunteers and manage live execution. Critical cases can carry multiple volunteers.</p>
      </div>
      <div className="space-y-4">
        {activeTasks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No accepted or active tasks right now.
            </CardContent>
          </Card>
        ) : (
          activeTasks.map((task) => {
            const isCritical = task.priorityLabel === "CRITICAL";
            const selected =
              selectedVolunteerIds[task.id] ??
              task.assignments?.map((assignment) => assignment.volunteerId) ??
              [];

            return (
              <Card key={task.id}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{task.id}</span>
                        <SeverityBadge level={toSeverity(task.priorityLabel)} />
                        <StatusBadge status={task.status} />
                      </div>
                      <h3 className="font-semibold mt-2">{task.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{task.address}</p>
                      {task.assignments && task.assignments.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {task.assignments.map((assignment) => (
                            <Badge key={assignment.id} variant="outline">
                              {(assignment.volunteer?.user?.fullName ?? "Volunteer")} · {formatStatusLabel(assignment.assignmentStatus)}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {isCritical ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Assign multiple volunteers</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {availableVolunteers.map((volunteer) => (
                          <label key={volunteer.id} className="flex items-center gap-2 rounded-lg border p-3 text-sm">
                            <Checkbox
                              checked={selected.includes(volunteer.id)}
                              onCheckedChange={(checked) => toggleVolunteer(task.id, volunteer.id, checked === true)}
                            />
                            <span>{volunteer.user?.fullName ?? "Volunteer"}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Select
                        value={selected[0]}
                        onValueChange={(value) =>
                          setSelectedVolunteerIds((current) => ({
                            ...current,
                            [task.id]: [value],
                          }))
                        }
                      >
                        <SelectTrigger className="w-72">
                          <SelectValue placeholder="Assign volunteer" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVolunteers.map((volunteer) => (
                            <SelectItem key={volunteer.id} value={volunteer.id}>
                              {volunteer.user?.fullName ?? "Volunteer"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      disabled={selected.length === 0}
                      onClick={() => assignMutation.mutate({ taskId: task.id, volunteerIds: selected })}
                    >
                      Save assignment
                    </Button>
                    <Button variant="outline" className="gap-1.5" onClick={() => assignMutation.mutate({ taskId: task.id })}>
                      <Sparkles className="h-4 w-4" /> AI suggest
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatedMetric } from "@/components/AnimatedMetric";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadge";
import { Check, X, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/services/api";
import { formatRelativeTime, toSeverity } from "@/lib/platform";
import { useSessionStore } from "@/store/session";

export const Route = createFileRoute("/ngo/")({
  component: Incoming,
});

function Incoming() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ["ngo", "tasks", accessToken],
    queryFn: () => apiClient.getNgoTasks(accessToken!),
    enabled: Boolean(accessToken),
  });
  const dashboardQuery = useQuery({
    queryKey: ["ngo", "dashboard", accessToken],
    queryFn: () => apiClient.getNgoDashboard(accessToken!),
    enabled: Boolean(accessToken),
  });

  const acceptMutation = useMutation({
    mutationFn: async (taskId: string) => apiClient.acceptNgoTask(accessToken!, taskId),
    onSuccess: async () => {
      toast.success("Task accepted.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ngo", "tasks", accessToken] }),
        queryClient.invalidateQueries({ queryKey: ["ngo", "dashboard", accessToken] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (taskId: string) =>
      apiClient.rejectNgoTask(accessToken!, taskId, "Rejected due to current NGO coverage or capacity limits."),
    onSuccess: async () => {
      toast.success("Task rejected.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ngo", "tasks", accessToken] }),
        queryClient.invalidateQueries({ queryKey: ["ngo", "dashboard", accessToken] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const incomingTasks = (tasksQuery.data ?? []).filter((task) => task.status === "PENDING_NGO_ACCEPTANCE");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Incoming tasks</h1>
        <p className="text-sm text-muted-foreground">Review newly routed cases and move them into active execution.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">NGO Workspace</p>
            <h2 className="mt-2 text-xl font-semibold">{dashboardQuery.data?.ngo.name ?? "NGO Dashboard"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Domains: {dashboardQuery.data?.ngo.domains.map((domain) => domain.name).join(", ") || "No domain configured yet."}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Pending verification</p>
            <AnimatedMetric
              value={dashboardQuery.data?.pendingVerification ?? 0}
              className="mt-2 text-3xl font-semibold"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {incomingTasks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No incoming tasks waiting for NGO acceptance.
            </CardContent>
          </Card>
        ) : (
          incomingTasks.map((task) => (
            <Card key={task.id} className="border-border/60 hover:shadow-[var(--shadow-elegant)] transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-muted-foreground">{task.id}</p>
                    <h3 className="font-semibold mt-1 truncate">{task.title}</h3>
                  </div>
                  <SeverityBadge level={toSeverity(task.priorityLabel)} />
                </div>
                <p className="text-sm text-muted-foreground mt-2">{task.category?.name ?? "General"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {task.address}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatRelativeTime(task.createdAt)}</span>
                  <StatusBadge status={task.status} />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button className="flex-1" onClick={() => acceptMutation.mutate(task.id)}>
                    <Check className="mr-1 h-4 w-4" /> Accept
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => rejectMutation.mutate(task.id)}>
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

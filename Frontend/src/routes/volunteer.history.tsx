import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";
import { formatRelativeTime } from "@/lib/platform";

export const Route = createFileRoute("/volunteer/history")({
  component: VolunteerHistory,
});

function VolunteerHistory() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const tasksQuery = useQuery({
    queryKey: ["volunteer", "tasks", accessToken],
    queryFn: () => apiClient.getVolunteerTasks(accessToken!),
    enabled: Boolean(accessToken),
  });

  const historyTasks = (tasksQuery.data ?? []).filter((task) => task.status === "VERIFIED_CLOSED");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Task history</h1>
        <p className="text-sm text-muted-foreground">Verified work is archived here after NGO approval.</p>
      </div>
      <Card>
        <CardContent className="p-0 divide-y">
          {historyTasks.length === 0 ? (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No verified tasks yet.
            </div>
          ) : (
            historyTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.id} · {task.address} · {formatRelativeTime(task.updatedAt ?? task.createdAt)}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

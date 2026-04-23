import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/services/api";
import { useSessionStore } from "@/store/session";

export const Route = createFileRoute("/ngo/verify")({
  component: NgoVerify,
});

function NgoVerify() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({
    queryKey: ["ngo", "tasks", accessToken],
    queryFn: () => apiClient.getNgoTasks(accessToken!),
    enabled: Boolean(accessToken),
  });

  const verifyMutation = useMutation({
    mutationFn: async (taskId: string) => apiClient.verifyNgoTask(accessToken!, taskId, true, "Work verified and task closed."),
    onSuccess: async () => {
      toast.success("Task verified.");
      await queryClient.invalidateQueries({ queryKey: ["ngo", "tasks", accessToken] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const reworkMutation = useMutation({
    mutationFn: async (taskId: string) =>
      apiClient.requestNgoTaskRework(accessToken!, taskId, "Evidence rejected. Please update the task and upload new proof."),
    onSuccess: async () => {
      toast.success("Rework requested.");
      await queryClient.invalidateQueries({ queryKey: ["ngo", "tasks", accessToken] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const verificationTasks = (tasksQuery.data ?? []).filter((task) => task.status === "COMPLETED_PENDING_VERIFICATION");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Task verification</h1>
        <p className="text-sm text-muted-foreground">Review evidence and either close the task or send it back for rework.</p>
      </div>
      {verificationTasks.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tasks are waiting for verification right now.
          </CardContent>
        </Card>
      ) : (
        verificationTasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="p-6 grid gap-4 md:grid-cols-[1fr_auto] items-start">
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{task.id} · {task.address}</p>
                <div className="mt-3 space-y-2">
                  {task.evidence?.length ? (
                    task.evidence.map((evidence) => (
                      <div key={evidence.id} className="rounded-lg border p-3 text-sm">
                        <p className="font-medium">{evidence.volunteer?.user?.fullName ?? "Volunteer evidence"}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {evidence.mediaType} · {evidence.verificationStatus}
                        </p>
                        {evidence.note ? <p className="mt-2">{evidence.note}</p> : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No evidence uploaded yet.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => reworkMutation.mutate(task.id)}>
                  Reject work
                </Button>
                <Button onClick={() => verifyMutation.mutate(task.id)}><Check className="mr-1 h-4 w-4" />Verify</Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

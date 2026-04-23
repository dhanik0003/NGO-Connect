import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadge";
import { Upload, MapPin, Navigation, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient, type ApiTask } from "@/services/api";
import { useSessionStore } from "@/store/session";
import { formatRelativeTime, formatStatusLabel, toSeverity } from "@/lib/platform";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/volunteer/")({
  component: VolunteerTasks,
});

function getOwnAssignment(task: ApiTask, volunteerProfileId?: string | null) {
  return task.assignments?.find((assignment) => assignment.volunteerId === volunteerProfileId);
}

function getVolunteerVisibleStatus(task: ApiTask, volunteerProfileId?: string | null) {
  const assignment = getOwnAssignment(task, volunteerProfileId);

  if (task.status === "VERIFIED_CLOSED") {
    return "VERIFIED_CLOSED";
  }

  if (task.status === "REWORK_NEEDED") {
    return "REWORK_NEEDED";
  }

  return assignment?.assignmentStatus ?? task.status;
}

function getVerificationLabel(task: ApiTask) {
  const latestEvidence = task.evidence?.[0];

  if (task.status === "VERIFIED_CLOSED" || latestEvidence?.verificationStatus === "VERIFIED") {
    return "Verified by NGO";
  }

  if (task.status === "REWORK_NEEDED" || latestEvidence?.verificationStatus === "REJECTED") {
    return "Rework requested";
  }

  if (task.status === "COMPLETED_PENDING_VERIFICATION") {
    return "Pending NGO verification";
  }

  return null;
}

function VolunteerTasks() {
  const [dialogTask, setDialogTask] = useState<ApiTask | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceNote, setEvidenceNote] = useState("");
  const accessToken = useSessionStore((state) => state.accessToken);
  const sessionUser = useSessionStore((state) => state.user);
  const queryClient = useQueryClient();
  const volunteerProfileId = sessionUser?.volunteerProfile?.id;
  const ngo = sessionUser?.volunteerProfile?.ngo;
  const ngoDomains = ngo?.domains?.map((domain) => domain.name).join(", ");

  const tasksQuery = useQuery({
    queryKey: ["volunteer", "tasks", accessToken],
    queryFn: () => apiClient.getVolunteerTasks(accessToken!),
    enabled: Boolean(accessToken),
  });

  const invalidateVolunteerData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["volunteer", "tasks", accessToken] }),
      queryClient.invalidateQueries({ queryKey: ["volunteer", "dashboard", accessToken] }),
      queryClient.invalidateQueries({ queryKey: ["notifications", accessToken] }),
    ]);
  };

  const responseMutation = useMutation({
    mutationFn: async ({ taskId, accepted }: { taskId: string; accepted: boolean }) =>
      apiClient.respondToVolunteerTask(accessToken!, taskId, accepted),
    onSuccess: async (_, variables) => {
      toast.success(variables.accepted ? "Task accepted." : "Task declined.");
      await invalidateVolunteerData();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: "on_the_way" | "in_progress" | "completed_pending_verification" | "accepted" }) =>
      apiClient.updateVolunteerTaskStatus(accessToken!, taskId, { status }),
    onSuccess: async (_, variables) => {
      toast.success(`Task marked as ${formatStatusLabel(variables.status)}.`);
      await invalidateVolunteerData();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const evidenceMutation = useMutation({
    mutationFn: async ({ taskId, note, media }: { taskId: string; note?: string; media: File }) =>
      apiClient.uploadVolunteerEvidence(accessToken!, taskId, { note, media }),
    onSuccess: async () => {
      toast.success("Evidence uploaded for NGO verification.");
      setDialogTask(null);
      setEvidenceFile(null);
      setEvidenceNote("");
      await invalidateVolunteerData();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const activeTasks = (tasksQuery.data ?? []).filter((task) => {
    const assignment = getOwnAssignment(task, volunteerProfileId);
    return Boolean(
      assignment &&
      assignment.assignmentStatus !== "REJECTED" &&
      assignment.assignmentStatus !== "VERIFIED_CLOSED" &&
      task.status !== "VERIFIED_CLOSED",
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your assigned tasks</h1>
        <p className="text-sm text-muted-foreground">
          Accept work, update travel status, and upload evidence when complete.
          {ngo?.name ? ` You belong to ${ngo.name}${ngoDomains ? ` (${ngoDomains})` : ""}.` : ""}
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {activeTasks.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No active tasks assigned right now.
            </CardContent>
          </Card>
        ) : (
          activeTasks.map((task) => {
            const assignment = getOwnAssignment(task, volunteerProfileId);
            const status = getVolunteerVisibleStatus(task, volunteerProfileId);
            const verificationLabel = getVerificationLabel(task);
            const isPendingResponse = assignment?.assignmentStatus === "PENDING";
            const isWaitingVerification = task.status === "COMPLETED_PENDING_VERIFICATION";
            const canUploadEvidence =
              !isPendingResponse &&
              assignment?.assignmentStatus !== "REJECTED" &&
              !isWaitingVerification;

            return (
              <Card key={task.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-muted-foreground">{task.id}</p>
                      <h3 className="font-semibold mt-1">{task.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {task.category?.name ?? "General"} · {formatRelativeTime(task.createdAt)}
                      </p>
                    </div>
                    <SeverityBadge level={toSeverity(task.priorityLabel)} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{task.address}</span>
                    <StatusBadge status={status} />
                    {verificationLabel ? <span>{verificationLabel}</span> : null}
                  </div>
                  {assignment?.note ? (
                    <p className="mt-3 text-sm text-muted-foreground">{assignment.note}</p>
                  ) : null}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {isPendingResponse ? (
                      <>
                        <Button size="sm" onClick={() => responseMutation.mutate({ taskId: task.id, accepted: true })}>
                          Accept
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => responseMutation.mutate({ taskId: task.id, accepted: false })}>
                          Reject
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={status === "ON_THE_WAY" || isWaitingVerification}
                          onClick={() => statusMutation.mutate({ taskId: task.id, status: "on_the_way" })}
                        >
                          <Navigation className="mr-1 h-4 w-4" />On the way
                        </Button>
                        <Button
                          size="sm"
                          disabled={!canUploadEvidence}
                          onClick={() => setDialogTask(task)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          {task.status === "REWORK_NEEDED" ? "Upload new proof" : "Complete"}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={Boolean(dialogTask)} onOpenChange={(open) => !open && setDialogTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload completion evidence</DialogTitle>
            <DialogDescription>
              {dialogTask?.status === "REWORK_NEEDED"
                ? "Upload updated proof so the NGO admin can review the reworked task."
                : "Upload a photo or video to move this task to NGO verification."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Evidence file</Label>
              <label className="mt-1.5 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition hover:bg-muted/40">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{evidenceFile?.name ?? "Choose photo or video"}</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>
            <div>
              <Label htmlFor="evidenceNote">Note</Label>
              <Textarea
                id="evidenceNote"
                value={evidenceNote}
                onChange={(event) => setEvidenceNote(event.target.value)}
                placeholder="What did you complete on the ground?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogTask(null)}>
              Cancel
            </Button>
            <Button
              disabled={!dialogTask || !evidenceFile || evidenceMutation.isPending}
              onClick={() => {
                if (!dialogTask || !evidenceFile) {
                  toast.error("Please choose an evidence file first.");
                  return;
                }

                evidenceMutation.mutate({
                  taskId: dialogTask.id,
                  note: evidenceNote.trim() || undefined,
                  media: evidenceFile,
                });
              }}
            >
              Upload and complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

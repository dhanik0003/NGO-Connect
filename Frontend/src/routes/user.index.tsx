import { createFileRoute } from "@tanstack/react-router";
import { ReportForm } from "@/components/ReportForm";

export const Route = createFileRoute("/user/")({
  component: () => (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Report an issue</h1>
        <p className="text-sm text-muted-foreground">Help us route this to the right team.</p>
      </div>
      <ReportForm />
    </div>
  ),
});

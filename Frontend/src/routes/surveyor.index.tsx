import { createFileRoute } from "@tanstack/react-router";
import { ReportForm } from "@/components/ReportForm";
import { useSessionStore } from "@/store/session";

export const Route = createFileRoute("/surveyor/")({
  component: SurveyorHome,
});

function SurveyorHome() {
  const ngo = useSessionStore((state) => state.user?.surveyProfile?.ngo);
  const ngoDomains = ngo?.domains?.map((domain) => domain.name).join(", ");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Submit field report</h1>
        <p className="text-sm text-muted-foreground">
          Add geo-tagged evidence and severity.
          {ngo?.name ? ` You belong to ${ngo.name}${ngoDomains ? ` (${ngoDomains})` : ""}.` : ""}
        </p>
      </div>
      <ReportForm mode="surveyor" />
    </div>
  );
}

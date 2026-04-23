import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge, StatusBadge } from "@/components/StatusBadge";
import { Timeline, type TimelineStep } from "@/components/Timeline";
import { MapView } from "@/components/MapView";
import { ArrowLeft } from "lucide-react";
import { apiClient } from "@/services/api";
import { buildTimelineSteps, toReportCard } from "@/lib/platform";
import { useSessionStore } from "@/store/session";

export const Route = createFileRoute("/user/reports/$id")({
  component: ReportDetail,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const accessToken = useSessionStore((state) => state.accessToken);
  const reportQuery = useQuery({
    queryKey: ["report", id, accessToken],
    queryFn: () => apiClient.getReport(accessToken!, id),
    enabled: Boolean(accessToken),
  });

  const liveReport = reportQuery.data;
  if (!liveReport && !reportQuery.isLoading) {
    throw notFound();
  }

  const report = liveReport ? toReportCard(liveReport) : null;
  if (!report) {
    throw notFound();
  }

  const steps: TimelineStep[] = buildTimelineSteps(liveReport?.statusHistory);

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to="/user/reports" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to reports
      </Link>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-mono text-muted-foreground">{report.id}</p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">{report.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{report.location} · {report.createdAt}</p>
        </div>
        <div className="flex gap-2">
          <SeverityBadge level={report.severity} />
          <StatusBadge status={report.status} />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Status timeline</CardTitle></CardHeader>
          <CardContent><Timeline steps={steps} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Location</CardTitle></CardHeader>
          <CardContent>
            <MapView center={[report.lat, report.lng]} zoom={14} markers={[{ id: report.id, lat: report.lat, lng: report.lng, label: report.title, tone: "primary" }]} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

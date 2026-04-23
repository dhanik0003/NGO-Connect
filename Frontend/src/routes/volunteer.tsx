import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { ListChecks, History, MapPin, ToggleRight } from "lucide-react";

const nav = [
  { to: "/volunteer", label: "Assigned tasks", icon: ListChecks },
  { to: "/volunteer/availability", label: "Availability", icon: ToggleRight },
  { to: "/volunteer/nearby", label: "Nearby tasks", icon: MapPin },
  { to: "/volunteer/history", label: "History", icon: History },
];

export const Route = createFileRoute("/volunteer")({
  component: () => (
    <DashboardShell roleLabel="Volunteer" userName="Volunteer Workspace" nav={nav}>
      <Outlet />
    </DashboardShell>
  ),
});

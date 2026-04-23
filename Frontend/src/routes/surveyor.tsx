import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { FilePlus, FileText, MapPin, Route as RouteIcon } from "lucide-react";

const nav = [
  { to: "/surveyor", label: "Submit report", icon: FilePlus },
  { to: "/surveyor/reports", label: "My reports", icon: FileText },
  { to: "/surveyor/region", label: "Region map", icon: MapPin },
  { to: "/surveyor/routing", label: "Routing view", icon: RouteIcon },
];

export const Route = createFileRoute("/surveyor")({
  component: () => (
    <DashboardShell roleLabel="Surveyor" userName="Surveyor Workspace" nav={nav}>
      <Outlet />
    </DashboardShell>
  ),
});

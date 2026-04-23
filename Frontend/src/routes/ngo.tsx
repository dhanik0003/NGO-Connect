import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { Inbox, CheckSquare, Users, MapPin, FileCheck, BarChart3, ClipboardCheck } from "lucide-react";

const nav = [
  { to: "/ngo", label: "Incoming", icon: Inbox },
  { to: "/ngo/accepted", label: "Accepted", icon: CheckSquare },
  { to: "/ngo/volunteers", label: "Volunteers", icon: Users },
  { to: "/ngo/availability", label: "Availability map", icon: MapPin },
  { to: "/ngo/surveyor-reports", label: "Surveyor reports", icon: ClipboardCheck },
  { to: "/ngo/verify", label: "Verification", icon: FileCheck },
  { to: "/ngo/analytics", label: "Analytics", icon: BarChart3 },
];

export const Route = createFileRoute("/ngo")({
  component: () => (
    <DashboardShell roleLabel="NGO Admin" userName="NGO Workspace" nav={nav}>
      <Outlet />
    </DashboardShell>
  ),
});

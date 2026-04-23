import { createFileRoute, Outlet } from "@tanstack/react-router";
import { DashboardShell } from "@/components/DashboardShell";
import { FilePlus, FileText, Bell } from "lucide-react";

const nav = [
  { to: "/user", label: "Report issue", icon: FilePlus },
  { to: "/user/reports", label: "My reports", icon: FileText },
  { to: "/user/notifications", label: "Notifications", icon: Bell },
];

export const Route = createFileRoute("/user")({
  component: () => (
    <DashboardShell roleLabel="Citizen" userName="Citizen Workspace" nav={nav}>
      <Outlet />
    </DashboardShell>
  ),
});

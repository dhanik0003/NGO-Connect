import { createFileRoute } from "@tanstack/react-router";
import { AdminDisabled } from "@/components/AdminDisabled";

export const Route = createFileRoute("/admin/routing")({
  component: AdminDisabled,
});

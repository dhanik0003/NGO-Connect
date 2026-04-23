import { createFileRoute } from "@tanstack/react-router";
import { AccountProfilePage } from "@/components/AccountProfilePage";

export const Route = createFileRoute("/surveyor/profile")({
  component: AccountProfilePage,
});

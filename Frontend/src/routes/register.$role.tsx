import { createFileRoute, notFound } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";
import { registerRoles, type RegisterRoleId } from "@/components/RoleSelector";
import { SITE_NAME } from "@/lib/brand";

export const Route = createFileRoute("/register/$role")({
  head: () => ({ meta: [{ title: `Register - ${SITE_NAME}` }] }),
  component: RegisterRole,
});

function RegisterRole() {
  const { role } = Route.useParams();
  if (!registerRoles.some((entry) => entry.id === role)) throw notFound();
  return <AuthForm mode="register" role={role as RegisterRoleId} />;
}

import { createFileRoute, notFound } from "@tanstack/react-router";
import { AuthForm } from "@/components/AuthForm";
import { loginRoles, type RoleId } from "@/components/RoleSelector";
import { SITE_NAME } from "@/lib/brand";

export const Route = createFileRoute("/login/$role")({
  head: () => ({ meta: [{ title: `Sign in - ${SITE_NAME}` }] }),
  component: LoginRole,
});

function LoginRole() {
  const { role } = Route.useParams();
  if (!loginRoles.some((entry) => entry.id === role)) throw notFound();
  return <AuthForm mode="login" role={role as RoleId} />;
}

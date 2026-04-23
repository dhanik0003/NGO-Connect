import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { RoleSelector } from "@/components/RoleSelector";
import { SITE_NAME } from "@/lib/brand";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: `Sign in - ${SITE_NAME}` }] }),
  component: LoginRouteComponent,
});

function LoginRouteComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (pathname === "/login") {
    return <RoleSelector mode="login" />;
  }

  return <Outlet />;
}

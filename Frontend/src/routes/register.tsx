import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { RoleSelector } from "@/components/RoleSelector";
import { SITE_NAME } from "@/lib/brand";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: `Register - ${SITE_NAME}` }] }),
  component: RegisterRouteComponent,
});

function RegisterRouteComponent() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (pathname === "/register") {
    return <RoleSelector mode="register" />;
  }

  return <Outlet />;
}

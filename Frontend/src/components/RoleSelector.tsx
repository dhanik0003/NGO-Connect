import { Link } from "@tanstack/react-router";
import { Building2, HardHat, HeartHandshake, User } from "lucide-react";
import { PublicNav, PublicFooter } from "@/components/PublicNav";
import { SITE_NAME } from "@/lib/brand";

const roleConfigs = [
  { id: "user", label: "Citizen / Reporter", desc: "Report issues and track them.", icon: User, dashboard: "/user", registerEnabled: true },
  { id: "ngo", label: "NGO Admin", desc: "Receive, accept and dispatch tasks.", icon: Building2, dashboard: "/ngo", registerEnabled: true },
  { id: "surveyor", label: "Surveyor", desc: "Submit verified field reports and route them correctly.", icon: HardHat, dashboard: "/surveyor", registerEnabled: true },
  { id: "volunteer", label: "Volunteer", desc: "Accept tasks, update status, and upload evidence.", icon: HeartHandshake, dashboard: "/volunteer", registerEnabled: true },
] as const;

export const loginRoles = roleConfigs;
export const registerRoles = roleConfigs.filter((role) => role.registerEnabled);

export type RoleId = (typeof roleConfigs)[number]["id"];
export type RegisterRoleId = (typeof registerRoles)[number]["id"];

interface Props {
  mode: "login" | "register";
}

export function RoleSelector({ mode }: Props) {
  const visibleRoles = mode === "login" ? loginRoles : registerRoles;

  return (
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center max-w-xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {mode === "login" ? `Sign in to ${SITE_NAME}` : "Create your account"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            Choose the role you want to {mode === "login" ? "sign in with" : "register for"}.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {visibleRoles.map((role) => (
            <Link
              key={role.id}
              to={mode === "login" ? "/login/$role" : "/register/$role"}
              params={{ role: role.id }}
              className="group rounded-xl border bg-card p-6 hover:border-primary/60 hover:shadow-[var(--shadow-elegant)] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <role.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{role.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{role.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>New here? <Link to="/register" className="text-primary font-medium">Create an account</Link></>
          ) : (
            <>Already have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link></>
          )}
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}

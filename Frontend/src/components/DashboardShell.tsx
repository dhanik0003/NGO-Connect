import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, LogOut, Menu, Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { apiClient } from "@/services/api";
import { formatRelativeTime } from "@/lib/platform";
import { useSessionStore } from "@/store/session";
import { getProfileRoute, getUserNgoLabel, getUserNgoMembership } from "@/lib/role-routing";
import { SITE_NAME, SITE_SHORT_NAME } from "@/lib/brand";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface Props {
  roleLabel: string;
  roleColor?: string;
  userName: string;
  nav: NavItem[];
  children?: ReactNode;
}

export function DashboardShell({ roleLabel, userName, nav, children }: Props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { location } = useRouterState();
  const sessionUser = useSessionStore((state) => state.user);
  const accessToken = useSessionStore((state) => state.accessToken);
  const clearSession = useSessionStore((state) => state.clearSession);
  const displayName = sessionUser?.fullName ?? userName;
  const profileRoute = getProfileRoute(sessionUser);
  const ngoLabel = getUserNgoLabel(sessionUser);
  const ngoMembership = getUserNgoMembership(sessionUser);
  const showNgoMembershipBanner = Boolean(
    ngoMembership &&
    (sessionUser?.role === "SURVEYOR" || sessionUser?.role === "VOLUNTEER"),
  );

  const notificationsQuery = useQuery({
    queryKey: ["notifications", accessToken],
    queryFn: () => apiClient.getNotifications(accessToken!),
    enabled: Boolean(accessToken),
  });

  const notifications = notificationsQuery.data?.slice(0, 3) ?? [];
  const hasNotifications = notifications.length > 0;

  const Sidebar = (
    <div className="flex h-full flex-col bg-sidebar border-r">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[var(--primary-glow)] text-primary-foreground font-bold">
          {SITE_SHORT_NAME}
        </div>
        <div>
          <p className="font-semibold leading-none">{SITE_NAME}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {nav.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                  : "text-sidebar-foreground hover:bg-sidebar-accent",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <Badge variant={active ? "secondary" : "outline"} className="h-5 px-1.5 text-[10px]">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2"
          onClick={() => {
            clearSession();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-[var(--gradient-subtle)]">
      <aside className="hidden lg:block w-64 shrink-0">{Sidebar}</aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 backdrop-blur px-4 md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              {Sidebar}
            </SheetContent>
          </Sheet>

          <div className="relative hidden md:block flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tasks, reports, volunteers..." className="pl-9 bg-muted/50 border-0" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {hasNotifications ? (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger" />
                  ) : null}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <DropdownMenuItem className="text-sm text-muted-foreground py-3">
                    No notifications yet.
                  </DropdownMenuItem>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem key={notification.id} className="flex flex-col items-start gap-0.5 py-2.5">
                      <span className="font-medium text-sm">{notification.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {notification.body || formatRelativeTime(notification.createdAt)}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {displayName.split(" ").map((segment) => segment[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="space-y-1">
                  <div>{displayName}</div>
                  {ngoLabel ? (
                    <div className="text-xs font-normal text-muted-foreground">
                      {ngoLabel}
                    </div>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: profileRoute })}>Profile</DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: profileRoute })}>Appearance</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    clearSession();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {showNgoMembershipBanner ? (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-[var(--shadow-soft)]">
              <Badge variant="secondary">NGO</Badge>
              <span className="text-sm font-medium">{ngoMembership?.name}</span>
              <Badge variant="outline">
                Domain{ngoMembership?.domains.length === 1 ? "" : "s"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {ngoMembership?.domains.length ? ngoMembership.domains.join(", ") : "No domain assigned yet."}
              </span>
            </div>
          ) : null}
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}

export { X };

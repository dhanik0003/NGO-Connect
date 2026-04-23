import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { apiClient } from "@/services/api";
import { formatRelativeTime } from "@/lib/platform";
import { useSessionStore } from "@/store/session";

export const Route = createFileRoute("/user/notifications")({
  component: UserNotifications,
});

function UserNotifications() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const notificationsQuery = useQuery({
    queryKey: ["notifications", accessToken],
    queryFn: () => apiClient.getNotifications(accessToken!),
    enabled: Boolean(accessToken),
  });

  const notifications = notificationsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
      </div>
      <Card>
        <CardContent className="p-0 divide-y">
          {notifications.length === 0 ? (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No notifications yet.
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="px-6 py-4 flex items-start gap-3">
                <div className={`mt-1 h-2 w-2 rounded-full ${notification.isRead ? "bg-transparent" : "bg-primary"}`} />
                <Bell className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(notification.createdAt)}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

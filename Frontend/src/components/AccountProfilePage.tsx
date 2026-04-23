import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { apiClient, type ApiAuthUser } from "@/services/api";
import { useSessionStore } from "@/store/session";
import { useThemeStore } from "@/store/theme";
import { formatStatusLabel } from "@/lib/platform";

function getAssociation(user?: ApiAuthUser | null) {
  if (!user) {
    return null;
  }

  if (user.role === "NGO_ADMIN") {
    const ngo = user.createdNgos?.[0];
    if (!ngo) {
      return null;
    }

    return {
      label: "Managing NGO",
      name: ngo.name,
      details:
        ngo.domains?.length
          ? `Domains: ${ngo.domains.map((domain) => domain.name).join(", ")}`
          : "No domains configured yet.",
    };
  }

  if (user.role === "SURVEYOR") {
    const ngo = user.surveyProfile?.ngo;
    return ngo
      ? {
          label: "Belongs to NGO",
          name: ngo.name,
          details: user.surveyProfile?.assignedRegionName
            ? `Surveyor address: ${user.surveyProfile.assignedRegionName}`
            : "Surveyor profile linked.",
        }
      : null;
  }

  if (user.role === "VOLUNTEER") {
    const ngo = user.volunteerProfile?.ngo;
    return ngo
      ? {
          label: "Belongs to NGO",
          name: ngo.name,
          details:
            ngo.domains?.length
              ? `Domains: ${ngo.domains.map((domain) => domain.name).join(", ")}`
              : "Volunteer profile linked.",
        }
      : null;
  }

  return {
    label: "Account type",
    name: "Citizen reporter",
    details: user.currentAddress ? `Current address: ${user.currentAddress}` : "Public issue reporting account.",
  };
}

export function AccountProfilePage() {
  const accessToken = useSessionStore((state) => state.accessToken);
  const sessionUser = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");

  const profileQuery = useQuery({
    queryKey: ["auth", "me", accessToken],
    queryFn: () => apiClient.getMe(accessToken!),
    enabled: Boolean(accessToken),
  });

  const profile = profileQuery.data ?? sessionUser;
  const association = getAssociation(profile);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setFullName(profile.fullName ?? "");
    setPhone(profile.phone ?? "");
    setCurrentAddress(profile.currentAddress ?? "");
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: async () =>
      apiClient.updateMe(accessToken!, {
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || null,
        currentAddress: currentAddress.trim() || null,
      }),
    onSuccess: async (user) => {
      setUser(user);
      toast.success("Profile updated.");
      await queryClient.invalidateQueries({ queryKey: ["auth", "me", accessToken] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Sign in to manage your profile.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account details and appearance preferences.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile.fullName.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{profile.fullName}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge className="mt-2" variant="outline">
                  {formatStatusLabel(profile.role)}
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="profileName">Full name</Label>
                <Input
                  id="profileName"
                  className="mt-1.5"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="profilePhone">Phone</Label>
                <Input
                  id="profilePhone"
                  className="mt-1.5"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="profileAddress">
                {profile.role === "SURVEYOR" ? "Surveyor address" : "Address"}
              </Label>
              <Input
                id="profileAddress"
                className="mt-1.5"
                value={currentAddress}
                onChange={(event) => setCurrentAddress(event.target.value)}
                placeholder="Add your working or current address"
              />
            </div>

            <Button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
              {profileMutation.isPending ? "Saving..." : "Save profile"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization</CardTitle>
            </CardHeader>
            <CardContent>
              {association ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{association.label}</p>
                  <p className="font-semibold">{association.name}</p>
                  <p className="text-sm text-muted-foreground">{association.details}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No linked NGO details are available for this account yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">Dark mode</p>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes for the dashboard.
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

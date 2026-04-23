import type { ApiAuthUser } from "@/services/api";

export const dashboardRouteByRole: Record<string, string> = {
  NGO_ADMIN: "/ngo",
  SURVEYOR: "/surveyor",
  VOLUNTEER: "/volunteer",
  USER: "/user",
};

export const profileRouteByRole: Record<string, string> = {
  NGO_ADMIN: "/ngo/profile",
  SURVEYOR: "/surveyor/profile",
  VOLUNTEER: "/volunteer/profile",
  USER: "/user/profile",
};

export function getProfileRoute(user?: ApiAuthUser | null) {
  if (!user) {
    return "/login";
  }

  return profileRouteByRole[user.role] ?? "/";
}

export function getUserNgoLabel(user?: ApiAuthUser | null) {
  const membership = getUserNgoMembership(user);

  if (!membership) {
    return null;
  }

  return membership.domains.length > 0
    ? `${membership.name} - ${membership.domains.join(", ")}`
    : membership.name;
}

export function getUserNgoMembership(user?: ApiAuthUser | null) {
  if (!user) {
    return null;
  }

  if (user.role === "NGO_ADMIN") {
    const ngo = user.createdNgos?.[0];
    return ngo
      ? {
          name: ngo.name,
          domains: ngo.domains?.map((domain) => domain.name) ?? [],
        }
      : null;
  }

  if (user.role === "SURVEYOR") {
    const ngo = user.surveyProfile?.ngo;
    return ngo
      ? {
          name: ngo.name,
          domains: ngo.domains?.map((domain) => domain.name) ?? [],
        }
      : null;
  }

  if (user.role === "VOLUNTEER") {
    const ngo = user.volunteerProfile?.ngo;
    return ngo
      ? {
          name: ngo.name,
          domains: ngo.domains?.map((domain) => domain.name) ?? [],
        }
      : null;
  }

  return null;
}

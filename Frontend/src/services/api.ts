export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface ApiNgoOption {
  id: string;
  name: string;
  serviceRadiusKm: number;
  verificationStatus?: string;
  domains: ApiCategory[];
}

export interface ApiStatusHistory {
  id: string;
  newStatus: string;
  note?: string | null;
  createdAt: string;
}

export interface ApiNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiAuthUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  currentAddress?: string | null;
  profileImageUrl?: string | null;
  createdNgos?: Array<{
    id: string;
    name: string;
    headquartersAddress?: string | null;
    verificationStatus?: string;
    domains?: ApiCategory[];
  }>;
  surveyProfile?: {
    id: string;
    assignedRegionName?: string;
    ngo?: { id: string; name: string; domains?: ApiCategory[] } | null;
  } | null;
  volunteerProfile?: {
    id: string;
    ngo?: { id: string; name: string; domains?: ApiCategory[] } | null;
  } | null;
}

export interface ApiAuthPayload {
  user: ApiAuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface ApiVolunteerProfile {
  id: string;
  latitude: number;
  longitude: number;
  serviceRadiusKm: number;
  availabilityStatus: string;
  currentWorkload: number;
  vehicleType?: string | null;
  rating?: number | null;
  tasksCompleted?: number;
  acceptanceRate?: number | null;
  skillsJson?: string[] | null;
  user?: {
    id: string;
    fullName: string;
    email?: string;
  } | null;
  ngo?: {
    id: string;
    name: string;
  } | null;
}

export interface ApiTaskEvidence {
  id: string;
  mediaUrl: string;
  mediaType: string;
  note?: string | null;
  verificationStatus: string;
  uploadedAt: string;
  volunteer?: ApiVolunteerProfile | null;
}

export interface ApiVolunteerAssignment {
  id: string;
  volunteerId: string;
  assignmentStatus: string;
  aiMatchScore?: number | null;
  assignedAt: string;
  respondedAt?: string | null;
  note?: string | null;
  volunteer?: ApiVolunteerProfile | null;
}

export interface ApiTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priorityLabel: string;
  priorityScore: number;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  updatedAt?: string;
  dueDate?: string | null;
  rejectionReason?: string | null;
  category?: ApiCategory | null;
  ngo?: { id: string; name: string } | null;
  assignedVolunteer?: ApiVolunteerProfile | null;
  assignments?: ApiVolunteerAssignment[];
  evidence?: ApiTaskEvidence[];
  statusHistory?: ApiStatusHistory[];
  masterReport?: { id: string; status: string; reporterRole?: string } | null;
}

export interface ApiReport {
  id: string;
  title: string;
  description: string;
  reporterUserId: string;
  status: string;
  priorityLabel: string;
  priorityScore: number;
  latitude: number;
  longitude: number;
  address: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
  createdAt: string;
  updatedAt: string;
  originalCategory?: ApiCategory | null;
  aiPredictedCategory?: ApiCategory | null;
  routedNgo?: { id: string; name: string } | null;
  linkedNgoTask?: ApiTask | null;
  statusHistory?: ApiStatusHistory[];
}

export interface ApiSurveyorDashboard {
  surveyor?: {
    id: string;
    assignedRegionName: string;
    latitude: number;
    longitude: number;
    serviceRadiusKm: number;
    ngo?: { id: string; name: string } | null;
  } | null;
  directCount: number;
  centralQueueCount: number;
  criticalCount: number;
  reports: ApiReport[];
}

export interface ApiVolunteerDashboard {
  volunteer: ApiVolunteerProfile;
  assignments: Array<{ assignmentStatus: string; _count: { _all: number } }>;
}

export interface ApiNgoDashboard {
  ngo: {
    id: string;
    name: string;
    domains: ApiCategory[];
  };
  taskCounts: Array<{ status: string; _count: { _all: number } }>;
  pendingVerification: number;
  activeVolunteers: number;
  surveyorCount: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type AuthRoleId = "user" | "ngo" | "surveyor" | "volunteer";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

const buildHeaders = (token?: string, hasJsonBody = true) => {
  const headers = new Headers();
  if (hasJsonBody) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
};

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? "Something went wrong while talking to the API.");
  }

  return payload.data;
}

export const apiClient = {
  getBootstrap() {
    return request<{ categories: ApiCategory[]; ngos: ApiNgoOption[] }>("/meta/bootstrap");
  },

  login(payload: { email: string; password: string }) {
    return request<ApiAuthPayload>("/auth/login", {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
  },

  register(role: AuthRoleId, payload: Record<string, unknown>) {
    const endpointMap: Record<AuthRoleId, string> = {
      user: "/auth/register/user",
      ngo: "/auth/register/ngo",
      surveyor: "/auth/register/surveyor",
      volunteer: "/auth/register/volunteer",
    };

    return request<ApiAuthPayload>(endpointMap[role], {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(payload),
    });
  },

  getMe(token: string) {
    return request<ApiAuthUser>("/auth/me", {
      headers: buildHeaders(token, false),
    });
  },

  updateMe(
    token: string,
    payload: {
      fullName?: string;
      phone?: string | null;
      currentAddress?: string | null;
      profileImageUrl?: string;
    },
  ) {
    return request<ApiAuthUser>("/auth/me", {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  createReport(
    token: string,
    payload: {
      title: string;
      description: string;
      categorySlug?: string;
      latitude: number;
      longitude: number;
      address: string;
      media?: File | null;
    },
  ) {
    const formData = new FormData();
    formData.set("title", payload.title);
    formData.set("description", payload.description);
    formData.set("latitude", String(payload.latitude));
    formData.set("longitude", String(payload.longitude));
    formData.set("address", payload.address);
    if (payload.categorySlug) {
      formData.set("categorySlug", payload.categorySlug);
    }
    if (payload.media) {
      formData.set("media", payload.media);
    }

    return request<ApiReport>("/reports", {
      method: "POST",
      headers: buildHeaders(token, false),
      body: formData,
    });
  },

  createSurveyorReport(
    token: string,
    payload: {
      title: string;
      description: string;
      categorySlug?: string;
      latitude: number;
      longitude: number;
      address: string;
      preferredRoute?: "ngo" | "central";
      isEmergency?: boolean;
      media?: File | null;
    },
  ) {
    const formData = new FormData();
    formData.set("title", payload.title);
    formData.set("description", payload.description);
    formData.set("latitude", String(payload.latitude));
    formData.set("longitude", String(payload.longitude));
    formData.set("address", payload.address);
    if (payload.categorySlug) {
      formData.set("categorySlug", payload.categorySlug);
    }
    if (payload.preferredRoute) {
      formData.set("preferredRoute", payload.preferredRoute);
    }
    if (payload.isEmergency) {
      formData.set("isEmergency", "true");
    }
    if (payload.media) {
      formData.set("media", payload.media);
    }

    return request<ApiReport>("/surveyor/reports", {
      method: "POST",
      headers: buildHeaders(token, false),
      body: formData,
    });
  },

  getMyReports(token: string) {
    return request<ApiReport[]>("/reports/my", {
      headers: buildHeaders(token, false),
    });
  },

  getSurveyorReports(token: string) {
    return request<ApiReport[]>("/surveyor/reports", {
      headers: buildHeaders(token, false),
    });
  },

  getSurveyorDashboard(token: string) {
    return request<ApiSurveyorDashboard>("/surveyor/dashboard", {
      headers: buildHeaders(token, false),
    });
  },

  getReport(token: string, id: string) {
    return request<ApiReport>(`/reports/${id}`, {
      headers: buildHeaders(token, false),
    });
  },

  getNotifications(token: string) {
    return request<ApiNotification[]>("/notifications", {
      headers: buildHeaders(token, false),
    });
  },

  getNgoTasks(token: string) {
    return request<ApiTask[]>("/ngo/tasks", {
      headers: buildHeaders(token, false),
    });
  },

  acceptNgoTask(token: string, taskId: string) {
    return request<ApiTask>(`/ngo/tasks/${taskId}/accept`, {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify({}),
    });
  },

  rejectNgoTask(token: string, taskId: string, note: string) {
    return request<ApiTask>(`/ngo/tasks/${taskId}/reject`, {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify({ note }),
    });
  },

  assignNgoTaskVolunteers(
    token: string,
    taskId: string,
    payload: { volunteerId?: string; volunteerIds?: string[]; note?: string },
  ) {
    return request<ApiTask>(`/ngo/tasks/${taskId}/assign-volunteer`, {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  verifyNgoTask(token: string, taskId: string, approved: boolean, note?: string) {
    return request<ApiTask>(`/ngo/tasks/${taskId}/verify`, {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify({ approved, note }),
    });
  },

  requestNgoTaskRework(token: string, taskId: string, note: string) {
    return request<ApiTask>(`/ngo/tasks/${taskId}/request-rework`, {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify({ note }),
    });
  },

  getNgoVolunteers(token: string) {
    return request<ApiVolunteerProfile[]>("/ngo/volunteers", {
      headers: buildHeaders(token, false),
    });
  },

  getNgoDashboard(token: string) {
    return request<ApiNgoDashboard>("/ngo/dashboard", {
      headers: buildHeaders(token, false),
    });
  },

  getVolunteerTasks(token: string) {
    return request<ApiTask[]>("/volunteer/tasks", {
      headers: buildHeaders(token, false),
    });
  },

  updateVolunteerTaskStatus(
    token: string,
    taskId: string,
    payload: { status: "accepted" | "on_the_way" | "in_progress" | "completed_pending_verification"; note?: string },
  ) {
    return request<ApiTask>(`/volunteer/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  respondToVolunteerTask(token: string, taskId: string, accepted: boolean, note?: string) {
    return request<ApiTask>(`/volunteer/tasks/${taskId}/${accepted ? "accept" : "reject"}`, {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify({ note }),
    });
  },

  uploadVolunteerEvidence(
    token: string,
    taskId: string,
    payload: { note?: string; media?: File | null },
  ) {
    const formData = new FormData();
    if (payload.note) {
      formData.set("note", payload.note);
    }
    if (payload.media) {
      formData.set("media", payload.media);
    }

    return request<ApiTask>(`/volunteer/tasks/${taskId}/evidence`, {
      method: "POST",
      headers: buildHeaders(token, false),
      body: formData,
    });
  },

  updateVolunteerAvailability(
    token: string,
    payload: { availabilityStatus: "AVAILABLE" | "UNAVAILABLE" | "OFFLINE" | "BUSY" },
  ) {
    return request<ApiVolunteerProfile>("/volunteer/availability", {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    });
  },

  getVolunteerDashboard(token: string) {
    return request<ApiVolunteerDashboard>("/volunteer/dashboard", {
      headers: buildHeaders(token, false),
    });
  },
};

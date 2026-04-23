import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ApiAuthPayload, ApiAuthUser } from "@/services/api";

interface SessionState {
  user: ApiAuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (payload: ApiAuthPayload) => void;
  setUser: (user: ApiAuthUser) => void;
  clearSession: () => void;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const storage = createJSONStorage<SessionState>(() =>
  typeof window !== "undefined" ? window.localStorage : noopStorage,
);

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (payload) =>
        set({
          user: payload.user,
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken,
        }),
      setUser: (user) =>
        set((state) => ({
          ...state,
          user,
        })),
      clearSession: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        }),
    }),
    {
      name: "ngo-connect-session",
      storage,
    },
  ),
);

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types/user";

interface RefreshResponse {
  access: string;
  refresh?: string;
}

function readStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

export function useAuthRestore() {
  const login = useAuthStore((s) => s.login);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [isRestoring, setIsRestoring] = useState(
    () => !isAuthenticated && !!readStoredRefreshToken(),
  );

  useEffect(() => {
    if (!isRestoring) return;
    if (isAuthenticated) return;

    const refreshToken = readStoredRefreshToken();
    if (!refreshToken) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";
    let cancelled = false;

    async function restore() {
      try {
        const { data: tokenData } = await axios.post<RefreshResponse>(
          `${baseUrl}/auth/token/refresh/`,
          { refresh: refreshToken },
        );

        const newRefresh = tokenData.refresh ?? refreshToken!;

        const { data: user } = await axios.get<User>(`${baseUrl}/auth/me/`, {
          headers: { Authorization: `Bearer ${tokenData.access}` },
        });

        if (cancelled) return;

        if (user.user_type !== "CUSTOMER") {
          localStorage.removeItem("refresh_token");
          return;
        }

        login(tokenData.access, newRefresh, user);
      } catch {
        if (!cancelled) localStorage.removeItem("refresh_token");
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    }

    restore();

    return () => {
      cancelled = true;
    };
  }, [isRestoring, isAuthenticated, login]);

  return { isLoading: isRestoring };
}

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
      let tokenData: RefreshResponse;
      try {
        const res = await axios.post<RefreshResponse>(
          `${baseUrl}/auth/token/refresh/`,
          { refresh: refreshToken },
        );
        tokenData = res.data;
      } catch {
        // The refresh request itself failed → the stored token is no
        // longer valid (expired, revoked, or wrong signing key). Clear
        // it so we don't loop on the next mount.
        if (!cancelled) localStorage.removeItem("refresh_token");
        if (!cancelled) setIsRestoring(false);
        return;
      }

      // Persist the rotated refresh immediately. Without this, if the
      // /auth/me/ call below fails (transient network, 5xx) we'd drop into
      // the catch block and remove the *old* refresh from storage — and
      // the old one is already blacklisted by the rotation we just did,
      // so the user would be permanently logged out until they sign in
      // again. Storing right after the rotation keeps the session safe.
      const newRefresh = tokenData.refresh ?? refreshToken!;
      if (tokenData.refresh) {
        localStorage.setItem("refresh_token", tokenData.refresh);
      }

      try {
        const { data: user } = await axios.get<User>(`${baseUrl}/auth/me/`, {
          headers: { Authorization: `Bearer ${tokenData.access}` },
        });
        if (cancelled) return;
        login(tokenData.access, newRefresh, user);
      } catch {
        // /me/ failed but the refresh token is valid and safely stored.
        // The next mount (reload) will retry. Don't clear the token.
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

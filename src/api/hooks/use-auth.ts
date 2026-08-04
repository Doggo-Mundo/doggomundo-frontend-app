import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/api/client";
import { useAuthStore } from "@/stores/auth-store";
import type { User } from "@/types/user";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ---------- Login ----------

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginApiResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}

export interface LoginResult {
  access: string;
  refresh: string;
  user: User;
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest): Promise<LoginResult> =>
      axios
        .post<LoginApiResponse>(`${API_BASE}/auth/login/`, data)
        .then((r) => ({
          access: r.data.tokens.access,
          refresh: r.data.tokens.refresh,
          user: r.data.user,
        })),
  });
}

// ---------- Walk-in setup (F-F.3) ----------

/** F-F.3: input del POST /api/auth/setup/. `token` viene del query
 *  string del magic-link email. Campos del pet son opcionales — el
 *  cliente puede llenarlos ahora o después desde su perfil. */
export interface WalkInSetupRequest {
  token: string;
  password: string;
  password_confirm: string;
  birth_date?: string;
  breed_id?: string;
  food_type_id?: string;
  food_brand_id?: string;
}

interface WalkInSetupResponse {
  access: string;
  refresh: string;
  user: User;
  pet_id: string | null;
}

/** Canjea el magic-link + setea password. En caso de éxito
 *  devuelve tokens JWT para autologin. */
export function useWalkInSetup() {
  return useMutation({
    mutationFn: (data: WalkInSetupRequest): Promise<WalkInSetupResponse> =>
      axios
        .post<WalkInSetupResponse>(`${API_BASE}/auth/setup/`, data)
        .then((r) => r.data),
  });
}

// ---------- Register ----------

export interface RegisterRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  password_confirm: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      axios.post(`${API_BASE}/auth/register/`, data).then((r) => r.data),
  });
}

// ---------- Verify Email ----------

interface VerifyEmailRequest {
  email: string;
  otp_code: string;
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (data: VerifyEmailRequest) =>
      axios.post(`${API_BASE}/auth/verify-email/`, data).then((r) => r.data),
  });
}

export function useResendVerificationOtp() {
  return useMutation({
    mutationFn: (email: string) =>
      axios
        .post(`${API_BASE}/auth/resend-otp/`, { email })
        .then((r) => r.data),
  });
}

// ---------- Password Reset ----------

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email: string) =>
      axios
        .post(`${API_BASE}/auth/request-reset/`, { email })
        .then((r) => r.data),
  });
}

export function useResendPasswordResetOtp() {
  return useMutation({
    mutationFn: (email: string) =>
      axios
        .post(`${API_BASE}/auth/resend-password-reset-otp/`, { email })
        .then((r) => r.data),
  });
}

interface ResetPasswordRequest {
  email: string;
  otp_code: string;
  new_password: string;
  new_password_confirm: string;
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) =>
      axios.post(`${API_BASE}/auth/reset-password/`, data).then((r) => r.data),
  });
}

// ---------- Logout ----------

export function useLogout() {
  return useMutation({
    mutationFn: (refreshToken: string) =>
      axios
        .post(`${API_BASE}/auth/logout/`, { refresh: refreshToken })
        .catch(() => {
          // Silently fail — we still clear local state
        }),
  });
}

// ---------- Current User ----------

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useMe(enabled = true) {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: () => api.get<User>("/auth/me/").then((r) => r.data),
    enabled,
    staleTime: 1000 * 60 * 5,
  });
}

export interface UpdateMePayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export function useUpdateMe() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (data: UpdateMePayload) =>
      api.patch<User>("/auth/me/", data).then((r) => r.data),
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(authKeys.me, user);
    },
  });
}

export function useUpdateMyPhoto() {
  const qc = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      return api
        .patch<User>("/auth/me/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    },
    onSuccess: (user) => {
      setUser(user);
      qc.setQueryData(authKeys.me, user);
    },
  });
}

import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";

export function CustomerGuard() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isInvalid = Boolean(user && user.user_type !== "CUSTOMER");

  useEffect(() => {
    if (isInvalid) {
      logout();
      toast.error("Esta cuenta es administrativa. Usa el panel de admin.");
    }
  }, [isInvalid, logout]);

  if (isInvalid) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/auth-store";

/** Inverso de AuthGuard: /login y /register son solo para visitantes
 *  sin sesión — si ya está autenticado, lo mandamos a Home en vez de
 *  dejarlo re-loguearse o crear otra cuenta por encima de la suya. */
export function GuestGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

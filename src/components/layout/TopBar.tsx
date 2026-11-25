import { useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { LogOut, PawPrint, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { cn } from "@/lib/utils";
import { SHOP_ENABLED } from "@/lib/features";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/api/hooks/use-auth";
import { useMembershipPlans } from "@/api/hooks/use-memberships";
import { selectCartCount, useCartStore } from "@/stores/cart-store";
import { resetUserSession } from "@/lib/session";

const ALL_DESKTOP_NAV = [
  { to: "/", label: "Inicio", end: true, key: "home" },
  { to: "/book", label: "Reservar", end: false, key: "book" },
  { to: "/my/appointments", label: "Mis citas", end: false, key: "appointments" },
  { to: "/memberships", label: "Membresías", end: false, key: "memberships" },
  { to: "/shop", label: "Tienda", end: false, key: "shop" },
];

export function TopBar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logoutMutation = useLogout();
  const cartCount = useCartStore(selectCartCount);
  // Data-driven: mismo criterio que HomePage — sin planes en el
  // catálogo, la tab desaparece. Cuando alta el primer plan,
  // reaparece sin redeploy.
  const membershipPlans = useMembershipPlans();
  const membershipsCatalogEmpty =
    !membershipPlans.isLoading
    && !membershipPlans.isError
    && (membershipPlans.data?.length ?? 0) === 0;
  const DESKTOP_NAV = useMemo(
    () =>
      ALL_DESKTOP_NAV.filter((item) => {
        if (item.key === "shop") return SHOP_ENABLED;
        if (item.key === "memberships") return !membershipsCatalogEmpty;
        return true;
      }),
    [membershipsCatalogEmpty],
  );

  async function handleLogout() {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      try {
        await logoutMutation.mutateAsync(refresh);
      } catch {
        // Network / blacklist failure on the server side must
        // not stop us from tearing down the local session — if
        // we bail here the user sees themselves as "still logged
        // in" until they hard-refresh. resetUserSession() is
        // strictly local so it always succeeds.
      }
    }
    resetUserSession();
    navigate("/login", { replace: true });
  }

  return (
    <header
      // V2: navy sólido, igual que el navbar de la landing.
      className="sticky top-0 z-30 border-b-2 border-ink-deep bg-primary text-white"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link
          to="/"
          className="flex shrink-0 items-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring"
        >
          <img src="/doggo-logo.png" alt="Doggo Mundo, inicio" className="h-11 w-auto" />
        </Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Navegación">
          {DESKTOP_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring",
                  isActive
                    ? "bg-navy-soft text-brand-blue-3"
                    : "text-white hover:bg-navy-soft hover:text-brand-blue-4",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/pets"
            aria-label="Mis Doggos"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-navy-soft hover:text-brand-blue-4 outline-none focus-visible:ring-3 focus-visible:ring-ring"
          >
            <PawPrint className="h-4 w-4" />
          </Link>

          {SHOP_ENABLED && (
            <Link
              to="/cart"
              aria-label={
                cartCount > 0
                  ? `Carrito con ${cartCount} producto${cartCount === 1 ? "" : "s"}`
                  : "Carrito"
              }
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-navy-soft hover:text-brand-blue-4 outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span
                  className="absolute right-0.5 top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-sun px-1 text-[10px] font-semibold text-primary"
                  aria-hidden="true"
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>
          )}

          {user && (
            <Link
              to="/profile"
              className={cn(
                "group inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-2 sm:pr-3 text-sm transition-colors",
                "hover:bg-navy-soft outline-none focus-visible:ring-3 focus-visible:ring-ring",
              )}
              aria-label="Ir a mi perfil"
            >
              <UserAvatar
                name={user.full_name || user.first_name || "?"}
                photo={user.photo}
                size="xs"
              />
              <span className="hidden font-semibold text-white group-hover:text-brand-blue-4 sm:inline">
                {user.first_name}
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-10 text-white hover:bg-navy-soft hover:text-brand-blue-4"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            aria-label="Cerrar sesión"
          >
            <LogOut />
          </Button>
        </div>
      </div>
    </header>
  );
}

import { NavLink } from "react-router-dom";
import { Home, CalendarPlus, CalendarDays, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { selectCartCount, useCartStore } from "@/stores/cart-store";

const TABS = [
  { to: "/", label: "Inicio", icon: Home, end: true, key: "home" },
  { to: "/book", label: "Reservar", icon: CalendarPlus, end: false, key: "book" },
  {
    to: "/my/appointments",
    label: "Citas",
    icon: CalendarDays,
    end: false,
    key: "appointments",
  },
  { to: "/shop", label: "Tienda", icon: ShoppingBag, end: false, key: "shop" },
  { to: "/profile", label: "Perfil", icon: User, end: true, key: "profile" },
] as const;

export function BottomNav() {
  const cartCount = useCartStore(selectCartCount);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const showBadge = tab.key === "shop" && cartCount > 0;
          return (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <span className="relative">
                  <tab.icon className="h-5 w-5" aria-hidden="true" />
                  {showBadge && (
                    <span
                      className="absolute -right-2 -top-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
                      aria-label={`${cartCount} en el carrito`}
                    >
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

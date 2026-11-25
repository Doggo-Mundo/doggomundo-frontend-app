import { NavLink } from "react-router-dom";
import {
  CalendarDays,
  CalendarPlus,
  Home,
  PawPrint,
  ShoppingBag,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SHOP_ENABLED } from "@/lib/features";
import { selectCartCount, useCartStore } from "@/stores/cart-store";

const ALL_TABS = [
  { to: "/", label: "Inicio", icon: Home, end: true, key: "home" },
  { to: "/book", label: "Reservar", icon: CalendarPlus, end: false, key: "book" },
  { to: "/pets", label: "Doggos", icon: PawPrint, end: false, key: "pets" },
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

const TABS = ALL_TABS.filter((tab) => SHOP_ENABLED || tab.key !== "shop");

export function BottomNav() {
  const cartCount = useCartStore(selectCartCount);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-background lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navegación principal"
    >
      <ul
        className={cn(
          "grid",
          TABS.length === 6
            ? "grid-cols-6"
            : TABS.length === 5
              ? "grid-cols-5"
              : "grid-cols-4",
        )}
      >
        {TABS.map((tab) => {
          const showBadge = tab.key === "shop" && cartCount > 0;
          return (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  cn(
                    // V2: la pestaña activa lleva el ícono en una
                    // píldora amarilla, como el estado activo de la
                    // landing.
                    "group/tab flex flex-col items-center justify-center gap-0.5 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                <span className="relative flex h-7 w-12 items-center justify-center rounded-full border-2 border-transparent transition-colors group-aria-[current=page]/tab:border-ink group-aria-[current=page]/tab:bg-sun">
                  <tab.icon className="h-5 w-5" aria-hidden="true" />
                  {showBadge && (
                    <span
                      className="absolute -right-1 -top-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground"
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

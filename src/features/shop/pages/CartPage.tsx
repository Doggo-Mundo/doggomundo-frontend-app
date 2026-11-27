import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Crown,
  Package,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptyShoppingIllustration } from "@/components/shared/illustrations/EmptyShoppingIllustration";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { BackLink } from "@/features/pets/components/BackLink";
import { QuantitySelector } from "@/features/shop/components/QuantitySelector";
import { formatMoney } from "@/features/orders/lib/format-money";
import {
  itemCap,
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from "@/stores/cart-store";
import { useCartAvailability } from "@/api/hooks/use-retail";
import { extractApiDetail } from "@/features/shop/lib/api-detail";
import type { CartAvailabilityItem } from "@/types/retail";
import { useMySubscriptions } from "@/api/hooks/use-memberships";
import {
  computeDiscount,
  selectRetailDiscountPct,
} from "@/features/shop/lib/membership-discount";

export function CartPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const count = useCartStore(selectCartCount);
  const subtotal = useCartStore(selectCartSubtotal);
  // F-B: mirror del cálculo del backend para preview del descuento
  // de membresía en el resumen. El backend sigue siendo autoridad —
  // esto solo evita que el cliente vea $X en el cart y $X-10% en el
  // checkout sin explicación.
  const subs = useMySubscriptions();
  const discountPct = selectRetailDiscountPct(subs.data);
  const { discount, net } = computeDiscount(subtotal, discountPct);

  // Stock por sucursal del carrito actual. El backend vuelve a validar
  // al pagar; esto es para avisar antes y no dejar avanzar con algo
  // que ninguna sucursal puede surtir.
  const requestItems = useMemo(
    () =>
      items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
    [items],
  );
  const availability = useCartAvailability(requestItems);
  const availabilityByProduct = useMemo(() => {
    const map = new Map<string, CartAvailabilityItem>();
    if (!availability.isPlaceholderData) {
      availability.data?.items.forEach((it) => map.set(it.product_id, it));
    }
    return map;
  }, [availability.data, availability.isPlaceholderData]);
  const hasStockProblem = items.some((item) => {
    const info = availabilityByProduct.get(item.productId);
    return !!info && item.quantity > info.max_available;
  });
  const noSingleLocation =
    !availability.isPlaceholderData &&
    !hasStockProblem &&
    !!availability.data &&
    availability.data.locations.length > 0 &&
    !availability.data.locations.some((l) => l.can_fulfill);
  // Mientras no tengamos la disponibilidad del carrito actual no
  // dejamos avanzar. Si el endpoint falla (red, producto inactivo) no
  // bloqueamos: el checkout vuelve a validar.
  const availabilityPending =
    availability.isPending || availability.isPlaceholderData;
  const canCheckout = !hasStockProblem && !availabilityPending;
  const availabilityError = availability.isError
    ? extractApiDetail(
        availability.error,
        "No pudimos revisar la disponibilidad de tu carrito.",
      )
    : null;

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <BackLink to="/shop" label="Tienda" />
        <EmptyState
          illustration={<EmptyShoppingIllustration />}
          title="Tu carrito está vacío"
          description="Explora la tienda y agrega lo que te guste."
          action={
            <Button asChild>
              <Link to="/shop">Ir a la tienda</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <BackLink to="/shop" label="Tienda" />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Tu carrito</h1>
        <p className="text-sm text-muted-foreground">
          {count === 1 ? "1 producto" : `${count} productos`}
        </p>
      </header>

      <ul className="space-y-3">
        {items.map((item) => {
          const lineTotal = Number(item.price) * item.quantity;
          const info = availabilityByProduct.get(item.productId);
          const maxAvailable = info?.max_available ?? item.maxAvailable;
          const soldOut = !!info && info.max_available <= 0;
          const overStock =
            !!info && !soldOut && item.quantity > info.max_available;
          return (
            <li key={item.productId}>
              <Card size="sm">
                <div className="flex items-start gap-3 px-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                    <ImageWithFallback
                      src={item.photo}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      fallbackClassName="h-full w-full"
                      fallback={
                        <Package className="h-6 w-6 text-muted-foreground" />
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    {item.brand && (
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {item.brand}
                      </p>
                    )}
                    <p className="line-clamp-2 text-sm font-medium">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatMoney(item.price)} c/u
                    </p>

                    {soldOut && (
                      <p
                        role="alert"
                        className="flex items-center gap-1 text-xs font-medium text-destructive"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        Agotado — quítalo para continuar.
                      </p>
                    )}
                    {overStock && info && (
                      <div
                        role="alert"
                        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-destructive"
                      >
                        <span className="inline-flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          {info.max_available === 1
                            ? "Solo hay 1 disponible."
                            : `Solo hay ${info.max_available} disponibles.`}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity(
                              item.productId,
                              info.max_available,
                              info.max_available,
                            )
                          }
                          className="rounded underline underline-offset-2 hover:text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          Ajustar a {info.max_available}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {soldOut ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => remove(item.productId)}
                        >
                          Quitar
                        </Button>
                      ) : (
                        <QuantitySelector
                          value={item.quantity}
                          onChange={(q) =>
                            setQuantity(item.productId, q, maxAvailable)
                          }
                          min={1}
                          max={Math.max(item.quantity, itemCap(maxAvailable))}
                          size="sm"
                        />
                      )}
                      <p className="text-sm font-semibold">
                        {formatMoney(lineTotal)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(item.productId)}
                    aria-label={`Quitar ${item.name}`}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {availabilityError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {availabilityError}
        </p>
      )}

      {noSingleLocation && (
        <p className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Ninguna sucursal tiene todo tu carrito. En el siguiente paso te
          decimos dónde está cada producto.
        </p>
      )}

      <Card>
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span
              className={
                discountPct > 0
                  ? "text-sm text-muted-foreground line-through"
                  : "text-lg font-semibold"
              }
            >
              {formatMoney(subtotal)}
            </span>
          </div>
          {discountPct > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1 text-secondary-foreground">
                  <Crown className="h-3.5 w-3.5" />
                  Descuento membresía ({discountPct}%)
                </span>
                <span className="text-secondary-foreground">
                  -{formatMoney(discount)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-sm font-medium">Total a pagar</span>
                <span className="text-xl font-semibold">
                  {formatMoney(net)}
                </span>
              </div>
            </>
          )}
          <p className="text-xs text-muted-foreground">
            IVA incluido. Recoges tu pedido en la sucursal que elijas en el
            siguiente paso.
          </p>
          <Button
            size="lg"
            className="w-full"
            onClick={() => navigate("/checkout")}
            disabled={!canCheckout}
          >
            <ShoppingCart />
            Ir al pago
          </Button>
        </div>
      </Card>
    </div>
  );
}

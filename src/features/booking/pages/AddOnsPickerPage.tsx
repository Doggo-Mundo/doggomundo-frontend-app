import { useEffect, useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Check, Minus, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { BookingStepHeader } from "@/features/booking/components/BookingStepHeader";
import { formatMoney } from "@/features/orders/lib/format-money";
import { useProducts } from "@/api/hooks/use-retail";
import {
  selectBookingAddonsCount,
  selectBookingAddonsSubtotal,
  useBookingFlowStore,
} from "@/stores/booking-flow-store";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/retail";

/**
 * F4-D optional cross-sell step. Renders a grid of retail products
 * flagged `is_addon_offering=true` and lets the customer pick
 * quantities that ride along with the booking payload.
 *
 * Two special behaviors:
 *
 * 1. **Auto-skip when catalog is empty**. Sucursales without any
 *    add-on offerings never see friction — the step forwards to
 *    /book/review the moment we learn the list is empty. The
 *    forward runs in an effect so we don't loop back if the customer
 *    hits the browser Back button.
 *
 * 2. **Location-scoped inventory is enforced server-side**. If the
 *    customer's picked add-on runs out between "next" and "confirmar
 *    reserva", the backend's OutOfStockError surfaces in the review
 *    step as a targeted error message — we don't pre-check here.
 */
export function AddOnsPickerPage() {
  const navigate = useNavigate();
  const pet = useBookingFlowStore((s) => s.pet);
  const addons = useBookingFlowStore((s) => s.addons);
  const setAddonQuantity = useBookingFlowStore((s) => s.setAddonQuantity);
  const totalCount = useBookingFlowStore(selectBookingAddonsCount);
  const totalMxn = useBookingFlowStore(selectBookingAddonsSubtotal);

  const { data, isLoading, isError } = useProducts({ addons_only: true });

  // Loaded and empty → skip the step entirely. Guard against
  // race-y double-navigate with the length check + `replace` so
  // browser Back doesn't leave the user stranded on an empty page.
  useEffect(() => {
    if (!isLoading && !isError && (data?.length ?? 0) === 0) {
      navigate("/book/review", { replace: true });
    }
  }, [isLoading, isError, data, navigate]);

  const byId = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of data ?? []) m.set(p.id, p);
    return m;
  }, [data]);

  if (!pet) return <Navigate to="/book/pet" replace />;

  function handleContinue() {
    navigate("/book/review");
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <BookingStepHeader
        stepKey="addons"
        backTo="/book/pet"
        title="¿Le agregas algo especial?"
        description="Opcional. Un shampoo, un juguete o un premio para tu peludo."
      />

      {isLoading ? (
        <LoadingState rows={3} />
      ) : isError ? (
        <p className="text-sm text-muted-foreground">
          No pudimos cargar los extras. Puedes seguir sin ellos.
        </p>
      ) : (data?.length ?? 0) === 0 ? (
        // Ephemeral state — the useEffect above will forward within
        // one render. Show nothing so we don't flash.
        <div className="h-24" />
      ) : (
        <ul className="space-y-2">
          {data!.map((product) => {
            const selected = addons.find(
              (a) => a.productId === product.id,
            );
            return (
              <li key={product.id}>
                <AddonRow
                  product={product}
                  quantity={selected?.quantity ?? 0}
                  onQuantityChange={(qty) =>
                    setAddonQuantity(
                      {
                        productId: product.id,
                        name: product.name,
                        price: product.price,
                        photo: product.photo,
                      },
                      qty,
                    )
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      {byId.size > 0 && (
        <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {totalCount === 0
                ? "Sin extras"
                : totalCount === 1
                  ? "1 extra"
                  : `${totalCount} extras`}
            </span>
            <span className="font-semibold">{formatMoney(totalMxn)}</span>
          </div>
          <Button size="lg" className="w-full" onClick={handleContinue}>
            {totalCount === 0
              ? "Seguir sin extras"
              : "Continuar con estos extras"}
          </Button>
        </div>
      )}
    </div>
  );
}

interface AddonRowProps {
  product: Product;
  quantity: number;
  onQuantityChange: (qty: number) => void;
}

function AddonRow({ product, quantity, onQuantityChange }: AddonRowProps) {
  const active = quantity > 0;
  return (
    <Card
      size="sm"
      className={cn(
        "transition-all",
        active ? "ring-2 ring-primary bg-secondary" : "hover:shadow-md",
      )}
    >
      <CardContent className="flex items-center gap-3 p-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
          <ImageWithFallback
            src={product.photo}
            alt={product.name}
            className="h-full w-full object-cover"
            fallbackClassName="h-full w-full"
            fallback={<Package className="h-5 w-5 text-muted-foreground" />}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-medium">{product.name}</p>
          {product.brand && (
            <p className="truncate text-xs text-muted-foreground">
              {product.brand}
            </p>
          )}
          <p className="text-sm font-semibold">{formatMoney(product.price)}</p>
        </div>
        {quantity === 0 ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onQuantityChange(1)}
            aria-label={`Agregar ${product.name}`}
          >
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        ) : (
          <div className="flex items-center gap-1 rounded-full border bg-background p-1">
            <button
              type="button"
              className="rounded-full p-1.5 hover:bg-muted"
              onClick={() => onQuantityChange(quantity - 1)}
              aria-label="Reducir cantidad"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-6 text-center text-sm font-medium tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              className="rounded-full p-1.5 hover:bg-muted disabled:opacity-40"
              onClick={() => onQuantityChange(quantity + 1)}
              disabled={quantity >= 10}
              aria-label="Aumentar cantidad"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            {active && (
              <Check className="mx-1 h-3.5 w-3.5 text-primary" aria-hidden />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

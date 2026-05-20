import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SuccessCheckmark } from "@/components/shared/SuccessCheckmark";
import { formatMoney } from "@/features/orders/lib/format-money";
import { useCartStore } from "@/stores/cart-store";

export function CheckoutSuccessPage() {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  // Snapshot the cart on mount so the summary keeps rendering after we clear.
  const snapshot = useMemo(
    () =>
      items.map((i) => ({
        ...i,
        lineTotal: Number(i.price) * i.quantity,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    // Defer to let the summary render with data, then empty the cart so the
    // user doesn't re-submit on refresh.
    const t = setTimeout(clear, 50);
    return () => clearTimeout(t);
  }, [clear]);

  const total = snapshot.reduce((s, i) => s + i.lineTotal, 0);
  const itemCount = snapshot.reduce((s, i) => s + i.quantity, 0);
  // useState initializer runs once on mount — OK to call impure functions there.
  const [orderRef] = useState(
    () => `DM-${Math.floor(100000 + Math.random() * 900000)}`,
  );

  if (snapshot.length === 0) {
    return <Navigate to="/shop" replace />;
  }

  return (
    <div
      className="mx-auto max-w-md space-y-6 py-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex justify-center">
        <SuccessCheckmark />
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">¡Pedido confirmado!</h1>
        <p className="text-sm text-muted-foreground">
          Simulación — este pedido no se cobró. Así se vería el flujo real.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4 text-left">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Folio</span>
            <span className="font-mono">{orderRef}</span>
          </div>

          <hr className="border-border" />

          <ul className="space-y-2 text-sm">
            {snapshot.map((item) => (
              <li
                key={item.productId}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × {formatMoney(item.price)}
                  </p>
                </div>
                <p className="shrink-0 font-medium">
                  {formatMoney(item.lineTotal)}
                </p>
              </li>
            ))}
          </ul>

          <hr className="border-border" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {itemCount === 1 ? "1 producto" : `${itemCount} productos`}
            </span>
            <span className="text-lg font-semibold">{formatMoney(total)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Button asChild size="lg" className="w-full">
          <Link to="/shop">Seguir comprando</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link to="/my/orders">Ver mis órdenes</Link>
        </Button>
      </div>
    </div>
  );
}

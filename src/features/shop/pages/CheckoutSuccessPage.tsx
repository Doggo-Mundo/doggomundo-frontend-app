import { useEffect, useMemo, useRef } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SuccessCheckmark } from "@/components/shared/SuccessCheckmark";
import { formatMoney } from "@/features/orders/lib/format-money";
import { useCartStore } from "@/stores/cart-store";
import { useRetailOrder } from "@/api/hooks/use-retail";

/**
 * Confirmation page after Stripe.js resolves the retail
 * PaymentIntent. The frontend polls GET /api/retail/orders/<id>/
 * until status flips from "draft" to "paid" — the webhook does the
 * flip within a couple seconds of Stripe confirming the charge.
 *
 * Three states surfaced to the user:
 *   - draft (polling): spinner + "Confirmando tu pago…".
 *   - paid: success animation + order summary + CTAs.
 *   - void: rare — the hold expired or a checkout error voided the
 *     draft. Send them back to /shop with an inline explanation.
 *
 * We clear the cart the first time we see status === "paid" so a
 * refresh keeps showing the confirmation without re-populating.
 */
export function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get("order_id");
  const clear = useCartStore((s) => s.clear);

  const orderQuery = useRetailOrder(orderId);
  const order = orderQuery.data;

  // Clear the cart exactly once, the first time we see status="paid".
  // A ref guard prevents re-clearing on refetches (query polling can
  // fire again immediately after status flips).
  const clearedRef = useRef(false);
  useEffect(() => {
    if (order?.status === "paid" && !clearedRef.current) {
      clearedRef.current = true;
      clear();
    }
  }, [order?.status, clear]);

  // Missing order_id → someone navigated directly. Punt to the shop.
  if (!orderId) {
    return <Navigate to="/shop" replace />;
  }

  // Ownership 404 (order doesn't belong to this user) or unknown id.
  if (orderQuery.isError) {
    return (
      <StatusScreen
        icon={<AlertCircle className="h-12 w-12 text-destructive" />}
        title="No encontramos tu pedido"
        subtitle="Puede que el enlace haya expirado o el pedido no exista."
        actions={
          <Button asChild size="lg" className="w-full">
            <Link to="/shop">Volver a la tienda</Link>
          </Button>
        }
      />
    );
  }

  // First render while the query kicks off.
  if (orderQuery.isPending || !order) {
    return <PendingScreen message="Cargando tu pedido…" />;
  }

  // Draft: webhook hasn't landed yet. Keep polling (useRetailOrder
  // handles the interval); show the customer a friendly wait state.
  if (order.status === "draft") {
    return <PendingScreen message="Confirmando tu pago…" />;
  }

  // Void: the hold expired mid-checkout, or the backend voided the
  // order after a Stripe error. Rare, but explain it clearly.
  if (order.status === "void") {
    return (
      <StatusScreen
        icon={<AlertCircle className="h-12 w-12 text-amber-500" />}
        title="El pedido no se completó"
        subtitle={
          "La reserva de inventario venció o hubo un problema con el pago. " +
          "Intenta de nuevo desde el carrito."
        }
        actions={
          <Button asChild size="lg" className="w-full">
            <Link to="/cart">Volver al carrito</Link>
          </Button>
        }
      />
    );
  }

  // Success — status === "paid".
  return <PaidScreen order={order} />;
}

// -----------------------------------------------------------------------------
// Screens
// -----------------------------------------------------------------------------

function PendingScreen({ message }: { message: string }) {
  return (
    <StatusScreen
      icon={<Loader2 className="h-12 w-12 animate-spin text-primary" />}
      title="Un momento…"
      subtitle={message}
      actions={null}
    />
  );
}

interface StatusScreenProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actions: React.ReactNode;
}

function StatusScreen({ icon, title, subtitle, actions }: StatusScreenProps) {
  return (
    <div
      className="mx-auto max-w-md space-y-6 py-4 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="flex justify-center">{icon}</div>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions && <div className="space-y-2">{actions}</div>}
    </div>
  );
}

function PaidScreen({
  order,
}: {
  order: NonNullable<ReturnType<typeof useRetailOrder>["data"]>;
}) {
  const totalItems = useMemo(
    () => order.lines.reduce((s, l) => s + l.quantity, 0),
    [order.lines],
  );
  // Short human-friendly folio derived from the UUID. Stripe already
  // sends the fiscal receipt with its own reference; this is just for
  // the customer to reference when they walk into the sucursal.
  const shortRef = `DM-${order.id.slice(0, 8).toUpperCase()}`;

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
          Te enviamos el recibo por correo. Pásalo a recoger cuando te avisemos.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-4 text-left">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Folio</span>
            <span className="font-mono">{shortRef}</span>
          </div>

          <hr className="border-border" />

          <ul className="space-y-2 text-sm">
            {order.lines.map((line) => (
              <li
                key={line.product_id ?? line.description_snapshot}
                className="flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {line.description_snapshot}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {line.quantity} × {formatMoney(line.unit_price)}
                  </p>
                </div>
                <p className="shrink-0 font-medium">
                  {formatMoney(line.line_total)}
                </p>
              </li>
            ))}
          </ul>

          <hr className="border-border" />

          <div className="space-y-1 text-sm">
            <Row label="Subtotal" value={formatMoney(order.subtotal)} />
            <Row label="IVA" value={formatMoney(order.tax_total)} />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-muted-foreground">
              {totalItems === 1 ? "1 producto" : `${totalItems} productos`}
            </span>
            <span className="text-lg font-semibold">
              {formatMoney(order.total)}
            </span>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

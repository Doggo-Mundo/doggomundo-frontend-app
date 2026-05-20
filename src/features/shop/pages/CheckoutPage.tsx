import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Building2,
  CreditCard,
  Info,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { BackLink } from "@/features/pets/components/BackLink";
import { formatMoney } from "@/features/orders/lib/format-money";
import { useAuthStore } from "@/stores/auth-store";
import {
  selectCartSubtotal,
  useCartStore,
} from "@/stores/cart-store";
import { cn } from "@/lib/utils";

type DeliveryMethod = "pickup" | "delivery";
type PaymentMethod = "card" | "store";

const SHIPPING_COST = 89;

export function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const user = useAuthStore((s) => s.user);

  const [delivery, setDelivery] = useState<DeliveryMethod>("pickup");
  const [payment, setPayment] = useState<PaymentMethod>("card");
  const [isProcessing, setIsProcessing] = useState(false);

  if (items.length === 0) return <Navigate to="/cart" replace />;

  const shipping = delivery === "delivery" ? SHIPPING_COST : 0;
  const total = subtotal + shipping;

  function handlePay() {
    setIsProcessing(true);
    // Fake processing delay so the success animation feels earned
    setTimeout(() => {
      navigate("/checkout/success", { replace: true });
    }, 1100);
  }

  return (
    <div className="space-y-5">
      <BackLink to="/cart" label="Carrito" />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Finalizar compra</h1>
        <p className="text-sm text-muted-foreground">
          Revisa tus datos y confirma el pedido.
        </p>
      </header>

      <div
        className="flex items-start gap-2 rounded-md border border-dashed bg-surface-soft p-3 text-xs text-surface-soft-foreground"
        role="note"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          <strong>Simulación.</strong> El pago en línea todavía no está activo —
          este flujo es solo una vista previa. No se generará orden real ni se
          cobrará nada.
        </p>
      </div>

      {/* Delivery method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <MethodOption
            active={delivery === "pickup"}
            onClick={() => setDelivery("pickup")}
            icon={<Building2 className="h-4 w-4" />}
            title="Recoger en sucursal"
            subtitle="Sin costo · Listo en 24 h"
          />
          <MethodOption
            active={delivery === "delivery"}
            onClick={() => setDelivery("delivery")}
            icon={<Truck className="h-4 w-4" />}
            title="Envío a domicilio"
            subtitle={`${formatMoney(SHIPPING_COST)} · 2–4 días hábiles`}
          />
        </CardContent>
      </Card>

      {/* Address (only when delivery) */}
      {delivery === "delivery" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dirección de envío</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="street">Calle y número</Label>
                <Input id="street" placeholder="Av. Insurgentes Sur 1234" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="colonia">Colonia</Label>
                <Input id="colonia" placeholder="Del Valle" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" placeholder="CDMX" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="zip">Código postal</Label>
                <Input id="zip" placeholder="03100" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Referencias (opcional)</Label>
              <Input id="notes" placeholder="Entre calles, color de puerta…" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pickup location (when pickup) */}
      {delivery === "pickup" && (
        <Card>
          <CardContent className="flex items-start gap-3 p-4">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium">Sucursal Polanco</p>
              <p className="text-xs text-muted-foreground">
                Av. Presidente Masaryk 123, Polanco, CDMX
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Se confirmará cuando esté listo para recoger.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pago</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <MethodOption
            active={payment === "card"}
            onClick={() => setPayment("card")}
            icon={<CreditCard className="h-4 w-4" />}
            title="Tarjeta de crédito/débito"
            subtitle="Pago seguro en línea (próximamente)"
          />
          <MethodOption
            active={payment === "store"}
            onClick={() => setPayment("store")}
            icon={<Building2 className="h-4 w-4" />}
            title="Pagar en sucursal"
            subtitle="Al recoger o al recibir"
          />
        </CardContent>
      </Card>

      {/* Order summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tu pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.productId} className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-muted">
                  <ImageWithFallback
                    src={item.photo}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    fallbackClassName="h-full w-full"
                    fallback={<Package className="h-4 w-4 text-muted-foreground" />}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{item.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {item.quantity} × {formatMoney(item.price)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium">
                  {formatMoney(Number(item.price) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <hr className="border-border" />

          <div className="space-y-1">
            <Row label="Subtotal" value={formatMoney(subtotal)} />
            <Row
              label={delivery === "pickup" ? "Recoger en sucursal" : "Envío"}
              value={shipping === 0 ? "Gratis" : formatMoney(shipping)}
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-semibold">{formatMoney(total)}</span>
          </div>

          {user?.email && (
            <p className="text-xs text-muted-foreground">
              Enviaremos el recibo a {user.email}.
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={handlePay}
        disabled={isProcessing}
      >
        {isProcessing
          ? "Procesando…"
          : payment === "card"
            ? `Pagar ${formatMoney(total)}`
            : "Confirmar pedido"}
      </Button>
    </div>
  );
}

interface MethodOptionProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

function MethodOption({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: MethodOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "border-primary bg-secondary"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <span
        className={cn(
          "h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
          active
            ? "border-primary bg-primary ring-2 ring-background"
            : "border-border",
        )}
        aria-hidden="true"
      />
    </button>
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

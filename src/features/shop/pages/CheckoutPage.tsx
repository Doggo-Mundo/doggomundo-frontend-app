import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, Building2, MapPin, Package } from "lucide-react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeError } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { BackLink } from "@/features/pets/components/BackLink";
import { formatMoney } from "@/features/orders/lib/format-money";
import { useAuthStore } from "@/stores/auth-store";
import {
  selectCartSubtotal,
  useCartStore,
} from "@/stores/cart-store";
import { useRetailCheckout } from "@/api/hooks/use-retail";
import { useLocations } from "@/api/hooks/use-locations";
import { getStripePromise } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import type {
  CheckoutResponse,
  OutOfStockDetail,
} from "@/types/retail";

/**
 * Retail checkout — cart summary + pickup location picker + Stripe
 * Elements. Split into two phases:
 *
 *   1. **Location + Review** (no Elements mounted yet). The user picks
 *      a pickup sucursal from the paginated list. Clicking "Continuar
 *      con el pago" fires POST /api/retail/checkout/ which reserves
 *      stock server-side and returns a PaymentIntent client_secret.
 *   2. **Payment** (Elements mounted with the returned clientSecret).
 *      PaymentElement collects the card; on "Pagar" we call
 *      confirmPayment with return_url set to the success page. Stripe
 *      handles 3DS challenges via the redirect flow when needed.
 *
 * Two-phase avoids mounting Elements before we know the amount, and
 * gives us a clean spot to surface out-of-stock errors BEFORE the user
 * enters card data.
 */

type Phase = "review" | "payment";

export function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore(selectCartSubtotal);
  const user = useAuthStore((s) => s.user);

  // Track only the user's explicit choice — the effective location is
  // derived below (userPick ?? first available). Storing the derived
  // value in state would need a useEffect to sync when the query
  // resolves; deriving avoids the cascading render.
  const [userPickedLocationId, setUserPickedLocationId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("review");
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const locations = useLocations();
  const activeLocations = useMemo(
    () => locations.data?.results ?? [],
    [locations.data],
  );
  // Default to the first sucursal so the customer can just hit
  // "Continuar" without a manual click when only one option exists
  // (common in early launch with a single sucursal).
  const pickupLocationId =
    userPickedLocationId ?? activeLocations[0]?.id ?? "";

  const checkoutMutation = useRetailCheckout();

  const handleStartPayment = useCallback(async () => {
    if (!pickupLocationId || items.length === 0) return;
    setErrorMsg(null);
    try {
      const response = await checkoutMutation.mutateAsync({
        pickup_location_id: pickupLocationId,
        items: items.map((it) => ({
          product_id: it.productId,
          quantity: it.quantity,
        })),
      });
      setCheckout(response);
      setPhase("payment");
    } catch (err: unknown) {
      setErrorMsg(extractCheckoutError(err));
    }
  }, [pickupLocationId, items, checkoutMutation]);

  if (items.length === 0 && phase === "review") {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="space-y-5">
      <BackLink to="/cart" label="Carrito" />

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Finalizar compra</h1>
        <p className="text-sm text-muted-foreground">
          Recoge tu pedido en la sucursal que elijas.
        </p>
      </header>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {phase === "review" && (
        <ReviewPhase
          items={items}
          subtotal={subtotal}
          userEmail={user?.email ?? ""}
          activeLocations={activeLocations}
          pickupLocationId={pickupLocationId}
          onPickLocation={setUserPickedLocationId}
          onSubmit={handleStartPayment}
          isSubmitting={checkoutMutation.isPending}
          locationsLoading={locations.isLoading}
        />
      )}

      {phase === "payment" && checkout && (
        <PaymentPhase
          checkout={checkout}
          onError={setErrorMsg}
          onBack={() => {
            // Back to review — the reservation stays alive server-side
            // for the remainder of the 15-min hold. If the customer
            // ultimately abandons, the cronjob voids the order.
            setPhase("review");
            setCheckout(null);
            setErrorMsg(null);
          }}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Phase 1: review + location picker
// -----------------------------------------------------------------------------

interface ReviewProps {
  items: ReturnType<typeof useCartStore.getState>["items"];
  subtotal: number;
  userEmail: string;
  activeLocations: Array<{ id: string; name: string; address: string }>;
  pickupLocationId: string;
  onPickLocation: (id: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  locationsLoading: boolean;
}

function ReviewPhase(props: ReviewProps) {
  const {
    items, subtotal, userEmail, activeLocations, pickupLocationId,
    onPickLocation, onSubmit, isSubmitting, locationsLoading,
  } = props;

  const canContinue = !!pickupLocationId && items.length > 0 && !isSubmitting;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recoger en sucursal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {locationsLoading && (
            <div className="h-12 animate-pulse rounded-md bg-muted" />
          )}
          {!locationsLoading && activeLocations.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay sucursales disponibles por ahora.
            </p>
          )}
          {activeLocations.map((loc) => (
            <LocationOption
              key={loc.id}
              active={pickupLocationId === loc.id}
              onClick={() => onPickLocation(loc.id)}
              name={loc.name}
              address={loc.address}
            />
          ))}
        </CardContent>
      </Card>

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
                    fallback={
                      <Package className="h-4 w-4 text-muted-foreground" />
                    }
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

          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-semibold">
              {formatMoney(subtotal)}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            IVA incluido. El desglose fiscal aparece en el recibo de Stripe.
          </p>

          {userEmail && (
            <p className="text-xs text-muted-foreground">
              Enviaremos el recibo a {userEmail}.
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        size="lg"
        className="w-full"
        onClick={onSubmit}
        disabled={!canContinue}
      >
        {isSubmitting ? "Reservando…" : "Continuar con el pago"}
      </Button>
    </>
  );
}

// -----------------------------------------------------------------------------
// Phase 2: Stripe PaymentElement
// -----------------------------------------------------------------------------

interface PaymentPhaseProps {
  checkout: CheckoutResponse;
  onError: (msg: string | null) => void;
  onBack: () => void;
}

function PaymentPhase({ checkout, onError, onBack }: PaymentPhaseProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pago</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <Elements
          stripe={getStripePromise()}
          options={{
            clientSecret: checkout.client_secret,
            appearance: { theme: "stripe" },
            locale: "es",
          }}
        >
          <PaymentInner
            orderId={checkout.order_id}
            amountTotal={checkout.amount_total}
            onError={onError}
            onBack={onBack}
          />
        </Elements>
      </CardContent>
    </Card>
  );
}

interface PaymentInnerProps {
  orderId: string;
  amountTotal: string;
  onError: (msg: string | null) => void;
  onBack: () => void;
}

function PaymentInner({
  orderId, amountTotal, onError, onBack,
}: PaymentInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Guard against double-clicks that would create two confirmation
  // attempts against the same PaymentIntent — Stripe would reject the
  // second one but the UI would flash a confusing error.
  const inFlightRef = useRef(false);

  const handleConfirm = useCallback(async () => {
    if (!stripe || !elements) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    onError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(
          submitError.message ??
            "Revisa los datos de la tarjeta antes de continuar.",
        );
        return;
      }
      // return_url is where Stripe sends the customer back if a 3DS
      // challenge or bank redirect fires. With redirect: "if_required"
      // we stay on this page when no redirect is needed and can
      // navigate ourselves; otherwise Stripe takes over and comes
      // back to the success page.
      const returnUrl =
        `${window.location.origin}/checkout/success?order_id=${orderId}`;
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });
      if (error) {
        onError(
          error.message ??
            "No se pudo confirmar el pago. Intenta con otra tarjeta.",
        );
        return;
      }
      // No redirect happened — go to the success page and let it
      // poll for the webhook.
      if (paymentIntent?.status === "succeeded") {
        navigate(`/checkout/success?order_id=${orderId}`, { replace: true });
        return;
      }
      // Rare: paymentIntent is defined but not succeeded (e.g. requires
      // more action but no redirect was returned). Surface it so the
      // user isn't left staring at a spinner.
      onError(
        "El pago quedó en un estado no esperado. Intenta de nuevo o " +
        "contacta a soporte.",
      );
    } catch (err) {
      onError(stripeErrorMessage(err));
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }, [stripe, elements, orderId, onError, navigate]);

  return (
    <div className="space-y-4">
      <PaymentElement
        onReady={() => setReady(true)}
        options={{ layout: "tabs" }}
      />
      {!ready && <div className="h-24 animate-pulse rounded-md bg-muted" />}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button
          size="lg"
          className="sm:flex-1"
          onClick={handleConfirm}
          disabled={!ready || submitting}
        >
          {submitting ? "Procesando…" : `Pagar ${formatMoney(amountTotal)}`}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={submitting}
        >
          Volver
        </Button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// UI bits
// -----------------------------------------------------------------------------

interface LocationOptionProps {
  active: boolean;
  onClick: () => void;
  name: string;
  address: string;
}

function LocationOption({
  active, onClick, name, address,
}: LocationOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        active
          ? "border-primary bg-secondary"
          : "border-border bg-background hover:bg-muted",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
        aria-hidden="true"
      >
        {active ? (
          <Building2 className="h-4 w-4" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{name}</span>
        <span className="block text-xs text-muted-foreground">{address}</span>
      </span>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Error extraction
// -----------------------------------------------------------------------------

/**
 * Turn a checkout mutation failure into a friendly message. The
 * backend's OutOfStockError arrives as a 400 with a structured body
 * (see OutOfStockDetail); everything else is a generic fallback.
 */
function extractCheckoutError(err: unknown): string {
  const anyErr = err as {
    response?: { data?: OutOfStockDetail | { detail?: string } };
  };
  const data = anyErr?.response?.data;
  if (data && "available" in data) {
    const oos = data as OutOfStockDetail;
    if (oos.available === 0) {
      return `“${oos.product_name}” no está disponible en esta sucursal.`;
    }
    return (
      `Solo quedan ${oos.available} de “${oos.product_name}”. ` +
      `Ajusta la cantidad en el carrito.`
    );
  }
  if (data && "detail" in data && typeof data.detail === "string") {
    return data.detail;
  }
  return "No pudimos iniciar el pago. Intenta de nuevo en unos momentos.";
}

function stripeErrorMessage(err: unknown): string {
  const anyErr = err as StripeError | { message?: string } | undefined;
  return anyErr?.message ?? "Error inesperado al procesar el pago.";
}

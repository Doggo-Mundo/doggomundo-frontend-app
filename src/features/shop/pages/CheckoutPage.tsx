import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  Crown,
  MapPin,
  Package,
  Plus,
} from "lucide-react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Stripe, StripeError } from "@stripe/stripe-js";
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
import {
  useCartAvailability,
  useRetailCheckout,
} from "@/api/hooks/use-retail";
import { usePaymentMethods } from "@/api/hooks/use-payments";
import { useMySubscriptions } from "@/api/hooks/use-memberships";
import {
  computeDiscount,
  selectRetailDiscountPct,
} from "@/features/shop/lib/membership-discount";
import { extractApiDetail } from "@/features/shop/lib/api-detail";
import { getStripePromise } from "@/lib/stripe";
import { cn } from "@/lib/utils";
import type {
  CartAvailabilityItem,
  CartAvailabilityLocation,
  CheckoutResponse,
} from "@/types/retail";
import { TestCardHint } from "@/components/environment/TestCardHint";

/**
 * Retail checkout — cart summary + pickup location picker + Stripe
 * Elements. Split into two phases:
 *
 *   1. **Location + Review** (no Elements mounted yet). The user picks
 *      a pickup sucursal from POST /retail/cart/availability/ — only
 *      sucursales that can supply the WHOLE cart are selectable (an
 *      order is picked up at a single sucursal). Clicking "Continuar
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
  // derived below (userPick ?? first fulfilling). Storing the derived
  // value in state would need a useEffect to sync when the query
  // resolves; deriving avoids the cascading render.
  const [userPickedLocationId, setUserPickedLocationId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("review");
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const requestItems = useMemo(
    () =>
      items.map((it) => ({ product_id: it.productId, quantity: it.quantity })),
    [items],
  );
  const availability = useCartAvailability(requestItems);
  // Placeholder = respuesta de un carrito anterior → no sirve para
  // decidir qué sucursal puede surtir el actual.
  const availabilityData = availability.isPlaceholderData
    ? undefined
    : availability.data;
  const locations = useMemo(
    () => availabilityData?.locations ?? [],
    [availabilityData],
  );
  // Default = primera sucursal que puede surtir todo el carrito (no
  // solo la primera de la lista). Si la elegida dejó de poder surtir
  // (refresco tras un error de stock), caemos al default.
  const pickupLocationId = useMemo(() => {
    const fulfilling = locations.filter((l) => l.can_fulfill);
    if (
      userPickedLocationId &&
      fulfilling.some((l) => l.id === userPickedLocationId)
    ) {
      return userPickedLocationId;
    }
    return fulfilling[0]?.id ?? "";
  }, [locations, userPickedLocationId]);

  const checkoutMutation = useRetailCheckout();
  const refetchAvailability = availability.refetch;

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
      // El stock cambió entre que cargamos la página y el submit:
      // refrescamos para que la lista de sucursales refleje lo real.
      if (isOutOfStockError(err)) void refetchAvailability();
    }
  }, [pickupLocationId, items, checkoutMutation, refetchAvailability]);

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
          locations={locations}
          availabilityItems={availabilityData?.items ?? []}
          pickupLocationId={pickupLocationId}
          onPickLocation={setUserPickedLocationId}
          onSubmit={handleStartPayment}
          isSubmitting={checkoutMutation.isPending}
          locationsLoading={!availabilityData && !availability.isError}
          availabilityError={
            availability.isError && !availabilityData
              ? extractApiDetail(
                  availability.error,
                  "No pudimos revisar la disponibilidad de tu carrito.",
                )
              : null
          }
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
  locations: CartAvailabilityLocation[];
  availabilityItems: CartAvailabilityItem[];
  pickupLocationId: string;
  onPickLocation: (id: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  locationsLoading: boolean;
  availabilityError: string | null;
}

function ReviewPhase(props: ReviewProps) {
  const {
    items, subtotal, userEmail, locations, availabilityItems,
    pickupLocationId, onPickLocation, onSubmit, isSubmitting,
    locationsLoading, availabilityError,
  } = props;
  const noneCanFulfill =
    locations.length > 0 && !locations.some((l) => l.can_fulfill);

  // F-B: preview del descuento en el review antes de crear la orden.
  // El backend recalcula al momento del checkout — este preview solo
  // evita la sorpresa de "vi X en el cart pero pagué Y".
  const subs = useMySubscriptions();
  const discountPct = selectRetailDiscountPct(subs.data);
  const { discount, net } = computeDiscount(subtotal, discountPct);

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
          {availabilityError && (
            <div
              role="alert"
              className="space-y-1 text-sm text-destructive"
            >
              <p>{availabilityError}</p>
              <Link to="/cart" className="font-medium underline underline-offset-2">
                Revisar mi carrito
              </Link>
            </div>
          )}
          {!locationsLoading &&
            !availabilityError &&
            locations.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay sucursales disponibles por ahora.
              </p>
            )}
          {noneCanFulfill && (
            <NoSingleLocationNotice
              items={availabilityItems}
              locationCount={locations.length}
            />
          )}
          {locations.map((loc) => (
            <LocationOption
              key={loc.id}
              active={pickupLocationId === loc.id}
              disabled={!loc.can_fulfill}
              onClick={() => onPickLocation(loc.id)}
              name={loc.name}
              address={loc.address}
              missingText={
                loc.can_fulfill ? null : describeMissing(loc)
              }
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

          {discountPct > 0 && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span>Subtotal</span>
                <span className="text-muted-foreground line-through">
                  {formatMoney(subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-secondary-foreground">
                  <Crown className="h-3 w-3" />
                  Descuento membresía ({discountPct}%)
                </span>
                <span className="text-secondary-foreground">
                  -{formatMoney(discount)}
                </span>
              </div>
            </>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold">Total</span>
            <span className="text-xl font-semibold">
              {formatMoney(discountPct > 0 ? net : subtotal)}
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

/**
 * F-fix: el picker de saved cards del PaymentElement + Customer
 * Session no expone consistentemente las tarjetas guardadas del
 * customer (staging bug — quedaban ocultas incluso con Customer
 * Session bien creada). Emulamos el mismo patrón que el booking
 * wizard (PaymentSection.tsx): listamos las tarjetas nosotros
 * mismos vía /payments/payment-methods/, y damos dos modos:
 *
 *   1. **Saved mode** — el usuario ve un card con su tarjeta
 *      default, botón "Cambiar" abre picker con todas sus
 *      tarjetas + "Agregar nueva". Al pagar hacemos
 *      `stripe.confirmCardPayment(client_secret, {
 *      payment_method: pm_id })` — sin re-capturar la tarjeta.
 *   2. **New card mode** — monta `<Elements>` con
 *      PaymentElement y usa `stripe.confirmPayment({ elements })`
 *      con `setup_future_usage: 'off_session'` (backend ya lo
 *      pasa) para que la tarjeta quede attached al customer y
 *      esté disponible en el próximo checkout.
 *
 * Elements SOLO se monta en modo "new" — evita re-mounts
 * innecesarios cuando el customer va a pagar con guardada.
 */
type PaymentView = "saved" | "new";

function PaymentPhase({ checkout, onError, onBack }: PaymentPhaseProps) {
  const list = usePaymentMethods();
  const cards = list.data ?? [];
  const hasSaved = cards.length > 0;

  // Explicit view chosen by the user. null = derive from data
  // (saved cards present → "saved", none → "new").
  const [view, setView] = useState<PaymentView | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);

  const defaultCard = cards.find((c) => c.is_default) ?? cards[0];
  const validPicked = pickedId
    ? cards.find((c) => c.id === pickedId)
    : null;
  const selectedCard = validPicked ?? defaultCard;

  const effectiveView: PaymentView =
    view ?? (hasSaved ? "saved" : "new");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pago</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {list.isLoading && (
          <div className="h-24 animate-pulse rounded-md bg-muted" />
        )}

        {!list.isLoading && effectiveView === "saved" && selectedCard && (
          <SavedCardCheckout
            checkout={checkout}
            cards={cards}
            selectedCard={selectedCard}
            onPick={(id) => setPickedId(id)}
            onSwitchToNew={() => setView("new")}
            onError={onError}
            onBack={onBack}
          />
        )}

        {!list.isLoading && effectiveView === "new" && (
          <NewCardCheckout
            checkout={checkout}
            hasSaved={hasSaved}
            onBackToSaved={() => setView("saved")}
            onError={onError}
            onBack={onBack}
          />
        )}
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Saved-card mode
// -----------------------------------------------------------------------------

interface SavedCheckoutProps {
  checkout: CheckoutResponse;
  cards: ReturnType<typeof usePaymentMethods>["data"] extends
    (infer T)[] | undefined
    ? T[]
    : never;
  selectedCard: NonNullable<
    ReturnType<typeof usePaymentMethods>["data"]
  >[number];
  onPick: (id: string) => void;
  onSwitchToNew: () => void;
  onError: (msg: string | null) => void;
  onBack: () => void;
}

const BRAND_LABEL: Record<string, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  diners: "Diners",
  jcb: "JCB",
  unionpay: "UnionPay",
  unknown: "Tarjeta",
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function SavedCardCheckout({
  checkout, cards, selectedCard, onPick, onSwitchToNew, onError, onBack,
}: SavedCheckoutProps) {
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Loaded once — no re-hydration between renders.
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    getStripePromise().then((s) => {
      if (!cancelled) setStripe(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePayWithSaved = useCallback(async () => {
    if (!stripe) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    onError(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        checkout.client_secret,
        { payment_method: selectedCard.id },
      );
      if (error) {
        onError(
          error.message ??
            "No se pudo confirmar el pago con tu tarjeta guardada.",
        );
        return;
      }
      if (paymentIntent?.status === "succeeded") {
        navigate(
          `/checkout/success?order_id=${checkout.order_id}`,
          { replace: true },
        );
        return;
      }
      // requires_action / other terminal-but-not-succeeded states
      // (3DS on saved card). confirmCardPayment triggers the
      // challenge modal itself; if we land here it means the
      // customer dismissed it.
      onError(
        "El pago quedó pendiente de validación. Intenta de nuevo " +
        "o usa otra tarjeta.",
      );
    } catch (err) {
      onError(stripeErrorMessage(err));
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }, [stripe, checkout, selectedCard, navigate, onError]);

  return (
    <div className="space-y-3">
      {!pickerOpen && (
        <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">
                {BRAND_LABEL[selectedCard.brand] ?? "Tarjeta"} ••••{" "}
                {selectedCard.last4}
              </p>
              {selectedCard.is_default && (
                <p className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" /> Tarjeta default
                </p>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPickerOpen(true)}
            disabled={submitting}
          >
            Cambiar
          </Button>
        </div>
      )}

      {pickerOpen && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Selecciona tu tarjeta</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPickerOpen(false)}
              className="-mr-2 h-auto px-2 py-1 text-xs"
            >
              Cancelar
            </Button>
          </div>
          {cards.map((card) => {
            const isSelected = card.id === selectedCard.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => {
                  onPick(card.id);
                  setPickerOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition hover:bg-muted/50",
                  isSelected && "border-primary ring-1 ring-primary",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {BRAND_LABEL[card.brand] ?? "Tarjeta"} ••••{" "}
                    {card.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vence {pad2(card.exp_month)}/
                    {String(card.exp_year).slice(-2)}
                    {card.is_default && (
                      <span className="ml-2 inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" /> Default
                      </span>
                    )}
                  </p>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
          <Button
            size="sm"
            variant="outline"
            onClick={onSwitchToNew}
            className="w-full"
          >
            <Plus className="mr-1 h-4 w-4" /> Agregar nueva tarjeta
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button
          size="lg"
          className="sm:flex-1"
          onClick={handlePayWithSaved}
          disabled={!stripe || submitting || pickerOpen}
        >
          {submitting
            ? "Procesando…"
            : `Pagar ${formatMoney(checkout.amount_total)}`}
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
// New-card mode
// -----------------------------------------------------------------------------

interface NewCheckoutProps {
  checkout: CheckoutResponse;
  hasSaved: boolean;
  onBackToSaved: () => void;
  onError: (msg: string | null) => void;
  onBack: () => void;
}

function NewCardCheckout({
  checkout, hasSaved, onBackToSaved, onError, onBack,
}: NewCheckoutProps) {
  // Mismo opt-in que antes al Customer Session — no daña nada si el
  // customer decide capturar tarjeta nueva, y habilita el checkbox
  // "Guardar tarjeta" del PaymentElement.
  const elementsOptions: Parameters<typeof Elements>[0]["options"] = {
    clientSecret: checkout.client_secret,
    appearance: { theme: "stripe" },
    locale: "es",
  };
  if (checkout.customer_session_client_secret) {
    elementsOptions.customerSessionClientSecret =
      checkout.customer_session_client_secret;
  }
  return (
    <div className="space-y-3">
      {hasSaved && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onBackToSaved}
          className="-ml-2 h-auto px-2 py-1 text-xs"
        >
          ← Volver a tarjetas guardadas
        </Button>
      )}
      <Elements stripe={getStripePromise()} options={elementsOptions}>
        <NewCardInner
          orderId={checkout.order_id}
          amountTotal={checkout.amount_total}
          onError={onError}
          onBack={onBack}
        />
      </Elements>
    </div>
  );
}

interface NewCardInnerProps {
  orderId: string;
  amountTotal: string;
  onError: (msg: string | null) => void;
  onBack: () => void;
}

function NewCardInner({
  orderId, amountTotal, onError, onBack,
}: NewCardInnerProps) {
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
      if (paymentIntent?.status === "succeeded") {
        navigate(
          `/checkout/success?order_id=${orderId}`,
          { replace: true },
        );
        return;
      }
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
      <TestCardHint />
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
  disabled?: boolean;
  onClick: () => void;
  name: string;
  address: string;
  /** "Falta: Kong (hay 0)" — solo para sucursales que no surten. */
  missingText?: string | null;
}

function LocationOption({
  active, disabled = false, onClick, name, address, missingText,
}: LocationOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-all outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        disabled
          ? "cursor-not-allowed border-border bg-muted/40 opacity-70"
          : active
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
        {missingText && (
          <span className="mt-1 block text-xs font-medium text-destructive">
            {missingText}
          </span>
        )}
      </span>
    </button>
  );
}

/** "Falta: Kong (hay 0), Pelota (hay 1)". */
function describeMissing(loc: CartAvailabilityLocation): string {
  if (loc.missing.length === 0) return "No tiene todo tu pedido.";
  return (
    "Falta: " +
    loc.missing.map((m) => `${m.product_name} (hay ${m.available})`).join(", ")
  );
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

/**
 * Ninguna sucursal tiene todo el carrito. Un pedido se recoge en una
 * sola sucursal, así que explicamos dónde está cada producto para que
 * el cliente quite productos o haga pedidos separados.
 */
function NoSingleLocationNotice({
  items, locationCount,
}: {
  items: CartAvailabilityItem[];
  locationCount: number;
}) {
  return (
    <div
      role="alert"
      className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <p className="flex items-start gap-2 font-medium">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        Ninguna sucursal tiene todo tu pedido.
      </p>
      <p className="text-xs">
        Cada pedido se recoge en una sola sucursal. Quita productos del
        carrito o haz pedidos separados.
      </p>
      {items.length > 0 && (
        <ul className="space-y-0.5 text-xs">
          {items.map((it) => (
            <li key={it.product_id}>
              <span className="font-medium">{it.product_name}:</span>{" "}
              {it.available_at.length >= locationCount
                ? "disponible en todas las sucursales"
                : it.available_at.length > 0
                ? `solo en ${joinNames(it.available_at)}`
                : it.max_available <= 0
                  ? "agotado"
                  : `no hay ${it.requested} en una misma sucursal (máximo ${it.max_available})`}
            </li>
          ))}
        </ul>
      )}
      <Link
        to="/cart"
        className="inline-block text-xs font-medium underline underline-offset-2"
      >
        Ajustar mi carrito
      </Link>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Error extraction
// -----------------------------------------------------------------------------

/**
 * Turn a checkout mutation failure into a friendly message. The
 * backend's out-of-stock 400 already carries a customer-facing
 * `detail` ("Solo queda 1 de “Kong” en Carso Palmas.") — show it as-is;
 * anything without a usable detail falls back to a generic message.
 */
function extractCheckoutError(err: unknown): string {
  return extractApiDetail(
    err,
    "No pudimos iniciar el pago. Intenta de nuevo en unos momentos.",
  );
}

function isOutOfStockError(err: unknown): boolean {
  const data = (err as { response?: { data?: { code?: unknown } } } | null)
    ?.response?.data;
  return data?.code === "out_of_stock";
}

function stripeErrorMessage(err: unknown): string {
  const anyErr = err as StripeError | { message?: string } | undefined;
  return anyErr?.message ?? "Error inesperado al procesar el pago.";
}

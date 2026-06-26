import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, CreditCard, Plus, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateSetupIntent,
  usePaymentMethods,
} from "@/api/hooks/use-payments";
import { StripeInlineError } from "@/features/booking/components/payment-section-errors";

/**
 * Imperative API: the parent calls `confirm()` to validate the card
 * selection and resolve to a Stripe PaymentMethod id (or throw on
 * failure). The single "Confirmar reserva" button in BookingReviewPage
 * orchestrates BOTH card confirmation AND appointment creation in one
 * click — no duplicate "Save card" / "Book" steps.
 *
 * Two modes:
 *   1. Saved card mode (preferred when the user has cards):
 *      confirm() resolves to the chosen saved pm_* immediately, no
 *      network round-trip. The card is reused without re-prompting.
 *   2. New card mode (no saved cards yet OR user chose "Usar otra"):
 *      creates a SetupIntent, mounts PaymentElement, confirms on
 *      submit, returns the freshly-attached pm_*.
 */
export interface PaymentSectionHandle {
  confirm: () => Promise<string>;
}

// loadStripe once per session — re-invoking on every render leaks
// iframes and is explicitly warned against in Stripe docs.
let _stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise() {
  if (_stripePromise) return _stripePromise;
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  _stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  return _stripePromise;
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

interface InnerHandle {
  confirm: () => Promise<string>;
}

type View = "selected" | "picker" | "new";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export const PaymentSection = forwardRef<PaymentSectionHandle, object>(
  function PaymentSection(_, ref) {
    const list = usePaymentMethods();
    // Explicit view chosen by the user. null = derive from data
    // (saved cards → "selected", none → "new"). Set when the user
    // clicks Cambiar / Agregar / Volver.
    const [view, setView] = useState<View | null>(null);
    // Explicit card the user picked from the picker. null = use the
    // Stripe default (or first card if no default flag set).
    const [pickedId, setPickedId] = useState<string | null>(null);
    // Ref (not state) for the inner handle. ElementsInner re-registers
    // itself on every Stripe-hook update — storing this in state would
    // trigger re-renders that propagate back down as new `onMount`
    // callbacks, causing an infinite mount loop (PaymentElement never
    // settles, skeleton stays forever).
    const innerHandleRef = useRef<InnerHandle | null>(null);
    const handleInnerMount = useCallback((h: InnerHandle) => {
      innerHandleRef.current = h;
    }, []);

    const cards = list.data ?? [];
    const hasSaved = cards.length > 0;
    const defaultCard = cards.find((c) => c.is_default) ?? cards[0];
    // Discard pickedId if the card was deleted between renders.
    const validPickedCard = pickedId
      ? cards.find((c) => c.id === pickedId)
      : null;
    const selectedCard = validPickedCard ?? defaultCard;

    const effectiveView: View = view ?? (hasSaved ? "selected" : "new");

    useImperativeHandle(
      ref,
      () => ({
        async confirm() {
          // Picker open with no choice yet → use whatever's highlighted
          // (selectedCard falls back to the default).
          if (effectiveView !== "new") {
            if (!selectedCard) {
              throw new Error(
                "No tienes una tarjeta guardada. Captura una nueva.",
              );
            }
            return selectedCard.id;
          }
          const handle = innerHandleRef.current;
          if (!handle) {
            throw new Error("El formulario aún no cargó. Intenta de nuevo.");
          }
          return handle.confirm();
        },
      }),
      [effectiveView, selectedCard],
    );

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Método de pago</CardTitle>
          <CardDescription>
            El cobro sucede al completar el servicio, no ahora.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {list.isLoading && (
            <div className="h-24 animate-pulse rounded-md bg-muted" />
          )}

          {!list.isLoading
            && effectiveView === "selected"
            && selectedCard && (
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
                onClick={() => setView("picker")}
              >
                Cambiar
              </Button>
            </div>
          )}

          {!list.isLoading && effectiveView === "picker" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Selecciona tu tarjeta</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setView("selected")}
                  className="-mr-2 h-auto px-2 py-1 text-xs"
                >
                  Cancelar
                </Button>
              </div>
              {cards.map((card) => {
                const isSelected = card.id === selectedCard?.id;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setPickedId(card.id);
                      setView("selected");
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
                onClick={() => setView("new")}
                className="w-full"
              >
                <Plus className="mr-1 h-4 w-4" /> Agregar nueva tarjeta
              </Button>
            </div>
          )}

          {!list.isLoading && effectiveView === "new" && (
            <div className="space-y-2">
              {hasSaved && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setView("selected")}
                  className="-ml-2 h-auto px-2 py-1 text-xs"
                >
                  ← Volver a tarjetas guardadas
                </Button>
              )}
              <NewCardCapture onMount={handleInnerMount} />
            </div>
          )}

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3 w-3 shrink-0" />
            Procesado por Stripe. Tu tarjeta nunca pasa por nuestros
            servidores.
          </p>
        </CardContent>
      </Card>
    );
  },
);

/**
 * Bare PaymentElement + SetupIntent flow. Exposes its imperative
 * `confirm()` to the parent via the `onMount` callback (we can't use
 * forwardRef because the component lives inside an <Elements> tree
 * that gets mounted/unmounted as `mode` toggles).
 */
function NewCardCapture({ onMount }: { onMount: (h: InnerHandle) => void }) {
  const intent = useCreateSetupIntent();

  useEffect(() => {
    if (!intent.data && !intent.isPending && !intent.error) {
      intent.mutate();
    }
  }, [intent]);

  if (intent.isPending || (!intent.data && !intent.error)) {
    return <div className="h-32 animate-pulse rounded-md bg-muted" />;
  }

  if (intent.error || !intent.data) {
    return (
      <p className="text-sm text-destructive">
        No pudimos preparar el cobro. Recarga la página o intenta de
        nuevo en unos minutos.
      </p>
    );
  }

  return (
    <Elements
      stripe={getStripePromise()}
      options={{
        clientSecret: intent.data.client_secret,
        appearance: { theme: "stripe" },
        locale: "es",
      }}
    >
      <ElementsInner onMount={onMount} />
    </Elements>
  );
}

function ElementsInner({ onMount }: { onMount: (h: InnerHandle) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onMount({
      async confirm() {
        if (!stripe || !elements) {
          throw new Error("Stripe aún no cargó. Intenta de nuevo.");
        }
        const { error: submitError } = await elements.submit();
        if (submitError) {
          throw new StripeInlineError(
            submitError.message ?? "Revisa los datos de la tarjeta.",
          );
        }
        const { error, setupIntent } = await stripe.confirmSetup({
          elements,
          redirect: "if_required",
        });
        if (error) {
          throw new StripeInlineError(
            error.message ?? "No se pudo confirmar la tarjeta.",
          );
        }
        const pmId = setupIntent?.payment_method;
        if (!pmId || typeof pmId !== "string") {
          throw new Error("Stripe no devolvió un método de pago válido.");
        }
        return pmId;
      },
    });
  }, [stripe, elements, onMount]);

  return (
    <div className="space-y-3">
      <PaymentElement
        onReady={() => setReady(true)}
        options={{
          layout: "tabs",
          wallets: { applePay: "never", googlePay: "never" },
        }}
      />
      {!ready && (
        <div className="h-24 animate-pulse rounded-md bg-muted" />
      )}
    </div>
  );
}

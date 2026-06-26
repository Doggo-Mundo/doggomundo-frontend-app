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
import { CheckCircle2, CreditCard, Shield } from "lucide-react";
import {
  useCreateSetupIntent,
  usePaymentMethods,
} from "@/api/hooks/use-payments";

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

export const PaymentSection = forwardRef<PaymentSectionHandle, object>(
  function PaymentSection(_, ref) {
    const list = usePaymentMethods();
    // User's explicit choice (toggled via "Usar otra" / "Volver").
    // null = no explicit pick yet, fall back to deriving from data.
    const [userPreference, setUserPreference] = useState<
      "saved" | "new" | null
    >(null);
    // Ref (not state) for the inner handle. ElementsInner re-registers
    // itself on every Stripe-hook update — storing this in state would
    // trigger re-renders that propagate back down as new `onMount`
    // callbacks, causing an infinite mount loop (PaymentElement never
    // settles, skeleton stays forever).
    const innerHandleRef = useRef<InnerHandle | null>(null);
    const handleInnerMount = useCallback((h: InnerHandle) => {
      innerHandleRef.current = h;
    }, []);

    const savedDefault = list.data?.find((p) => p.is_default) ?? list.data?.[0];
    const hasSaved = !!savedDefault;
    // Effective mode is derived, not stored — avoids a setState-in-
    // effect when the list arrives empty. User can override via the
    // toggle buttons (which set userPreference).
    const mode: "saved" | "new" =
      userPreference ?? (hasSaved ? "saved" : "new");

    useImperativeHandle(
      ref,
      () => ({
        async confirm() {
          if (mode === "saved") {
            if (!savedDefault) {
              throw new Error(
                "No tienes una tarjeta guardada. Captura una nueva.",
              );
            }
            return savedDefault.id;
          }
          const handle = innerHandleRef.current;
          if (!handle) {
            throw new Error("El formulario aún no cargó. Intenta de nuevo.");
          }
          return handle.confirm();
        },
      }),
      [mode, savedDefault],
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

          {!list.isLoading && hasSaved && mode === "saved" && (
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {BRAND_LABEL[savedDefault!.brand] ?? "Tarjeta"} ••••{" "}
                    {savedDefault!.last4}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Tarjeta default
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setUserPreference("new")}
              >
                Usar otra
              </Button>
            </div>
          )}

          {!list.isLoading && mode === "new" && (
            <div className="space-y-2">
              {hasSaved && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setUserPreference("saved")}
                  className="-ml-2 h-auto px-2 py-1 text-xs"
                >
                  ← Volver a tarjeta guardada
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
          throw new Error(
            submitError.message ?? "Revisa los datos de la tarjeta.",
          );
        }
        const { error, setupIntent } = await stripe.confirmSetup({
          elements,
          redirect: "if_required",
        });
        if (error) {
          throw new Error(
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

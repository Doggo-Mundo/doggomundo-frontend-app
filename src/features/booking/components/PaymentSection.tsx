import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
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
import { Shield } from "lucide-react";
import { useCreateSetupIntent } from "@/api/hooks/use-payments";

/**
 * Imperative API: the parent calls `confirm()` to validate the card
 * and resolve to a Stripe PaymentMethod id (or throw on failure).
 * Used so the single "Confirmar reserva" button in BookingReviewPage
 * orchestrates BOTH card confirmation AND appointment creation in one
 * click — no duplicate "Save card" / "Book" steps.
 */
export interface PaymentSectionHandle {
  confirm: () => Promise<string>;
}

interface Props {
  /** Used to scope error messaging. Defaults to "reserva". */
  contextLabel?: string;
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

export const PaymentSection = forwardRef<PaymentSectionHandle, Props>(
  function PaymentSection(_, ref) {
    // Each mount creates its own SetupIntent so the user's last
    // confirm doesn't carry into a re-attempt.
    const intent = useCreateSetupIntent();
    useEffect(() => {
      if (!intent.data && !intent.isPending && !intent.error) {
        intent.mutate();
      }
    }, [intent]);

    if (intent.isPending || (!intent.data && !intent.error)) {
      return (
        <Card>
          <CardHeader>
            <SectionHeader />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-32 animate-pulse rounded-md bg-muted" />
          </CardContent>
        </Card>
      );
    }

    if (intent.error || !intent.data) {
      return (
        <Card>
          <CardHeader>
            <SectionHeader />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-destructive">
              No pudimos preparar el cobro. Recarga la página o intenta
              de nuevo en unos minutos.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <SectionHeader />
        </CardHeader>
        <CardContent className="pt-0">
          <Elements
            stripe={getStripePromise()}
            options={{
              clientSecret: intent.data.client_secret,
              appearance: { theme: "stripe" },
            }}
          >
            <PaymentElementForm ref={ref} />
          </Elements>
        </CardContent>
      </Card>
    );
  },
);


function SectionHeader() {
  return (
    <>
      <CardTitle className="text-base">Método de pago</CardTitle>
      <CardDescription>
        Guardamos tu tarjeta de forma segura con Stripe. El cobro
        sucede al completar el servicio, no ahora.
      </CardDescription>
    </>
  );
}


const PaymentElementForm = forwardRef<PaymentSectionHandle>(
  function PaymentElementForm(_, ref) {
    const stripe = useStripe();
    const elements = useElements();
    const [ready, setReady] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        async confirm() {
          if (!stripe || !elements) {
            throw new Error("Stripe aún no cargó. Intenta de nuevo.");
          }
          // First validate the form locally — surfaces inline errors
          // (incomplete card, etc.) before going to the network.
          const { error: submitError } = await elements.submit();
          if (submitError) {
            throw new Error(
              submitError.message ?? "Revisa los datos de la tarjeta.",
            );
          }
          const { error, setupIntent } = await stripe.confirmSetup({
            elements,
            // Stay on this page; we'll navigate on booking success.
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
      }),
      [stripe, elements],
    );

    return (
      <div className="space-y-3">
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: "tabs" }}
        />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3 w-3 shrink-0" />
          Pago procesado por Stripe. Tu tarjeta nunca pasa por
          nuestros servidores.
        </p>
        {!ready && (
          <div className="h-24 animate-pulse rounded-md bg-muted" />
        )}
      </div>
    );
  },
);

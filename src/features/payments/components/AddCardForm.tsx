import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateSetupIntent } from "@/api/hooks/use-payments";

// loadStripe once per session — same singleton pattern as PaymentSection.
let _stripePromise: Promise<Stripe | null> | null = null;
function getStripePromise() {
  if (_stripePromise) return _stripePromise;
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  _stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  return _stripePromise;
}

interface Props {
  onAdded: () => void;
  onCancel: () => void;
}

/**
 * Self-contained card capture form. Creates a SetupIntent on mount,
 * mounts Stripe Elements, lets the customer enter a card, confirms it.
 * On success calls onAdded() — parent decides whether to close a
 * modal, refresh a list, navigate, etc.
 *
 * Used both by the standalone /payment-methods page ("Agregar tarjeta")
 * and by the booking wizard ("Usar otra tarjeta").
 */
export function AddCardForm({ onAdded, onCancel }: Props) {
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
      <div className="space-y-3">
        <p className="text-sm text-destructive">
          No pudimos preparar el formulario. Intenta de nuevo.
        </p>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cerrar
        </Button>
      </div>
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
      <ElementsInner onAdded={onAdded} onCancel={onCancel} />
    </Elements>
  );
}

function ElementsInner({ onAdded, onCancel }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!stripe || !elements) return;
    setError(null);
    setSubmitting(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message ?? "Revisa los datos de la tarjeta.");
        return;
      }
      const { error: confirmError, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });
      if (confirmError) {
        setError(confirmError.message ?? "No se pudo confirmar la tarjeta.");
        return;
      }
      if (!setupIntent?.payment_method) {
        setError("Stripe no devolvió un método de pago válido.");
        return;
      }
      toast.success("Tarjeta agregada");
      onAdded();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <PaymentElement
        options={{
          layout: "tabs",
          wallets: { applePay: "never", googlePay: "never" },
        }}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button size="sm" onClick={handleConfirm} disabled={submitting}>
          {submitting ? "Guardando…" : "Guardar tarjeta"}
        </Button>
      </div>
    </div>
  );
}

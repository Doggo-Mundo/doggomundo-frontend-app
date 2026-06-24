import { useMemo } from "react";
import type { ReactNode } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

/**
 * Mounts the Stripe Elements provider for every page underneath. The
 * publishable key is read from VITE_STRIPE_PUBLISHABLE_KEY at build
 * time — if it's not set (local dev without Stripe configured), the
 * provider renders children as-is and the payment UI can detect the
 * missing key and show an empty state.
 *
 * loadStripe is wrapped in useMemo so it only runs once per session;
 * Stripe's docs warn that recreating the Promise on every render leaks
 * iframes and breaks deep-link recovery flows.
 */
interface Props {
  children: ReactNode;
}

export function StripeProvider({ children }: Props) {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey],
  );

  if (!stripePromise) {
    // Stripe not configured for this environment. Children still
    // render so the rest of the app works; payment-specific UI is
    // responsible for detecting the missing key and showing a
    // disabled / "no configurado" state.
    return <>{children}</>;
  }

  return <Elements stripe={stripePromise}>{children}</Elements>;
}

/** True when Stripe is configured for this environment. */
export function stripeEnabled(): boolean {
  return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
}

import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Shared Stripe.js promise. Kept as a module-level singleton so the
 * PaymentSection (booking wizard), AddCardForm (membresías) and now
 * the retail CheckoutPage all mount the same SDK instance.
 *
 * `loadStripe` MUST be called exactly once per browser session — the
 * Stripe docs warn that re-invoking it leaks iframes and can leave
 * the PaymentElement stuck in "loading" forever. This helper
 * enforces that.
 */
let _stripePromise: Promise<Stripe | null> | null = null;

export function getStripePromise(): Promise<Stripe | null> {
  if (_stripePromise) return _stripePromise;
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  _stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  return _stripePromise;
}

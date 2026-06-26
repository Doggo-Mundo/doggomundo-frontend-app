/**
 * Errors that Stripe Elements has already rendered inside its own
 * iframe (CVC wrong, card declined, missing fields, etc.). The
 * caller should still stop the booking flow but MUST NOT show a
 * banner — otherwise the same message appears twice (red text
 * under the input + red banner under the form).
 *
 * Lives in its own file (not co-located with PaymentSection.tsx)
 * so the component module exports only components — required by
 * the react-refresh/only-export-components lint rule for fast
 * refresh to work cleanly during dev.
 */
export class StripeInlineError extends Error {
  readonly inline = true as const;
}

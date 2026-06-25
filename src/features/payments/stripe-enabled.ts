/** True when Stripe is configured for this environment.
 *
 * Lives in its own file (not co-located with StripeProvider) so that
 * the provider module exports only the component — required by the
 * react-refresh/only-export-components lint rule for fast refresh to
 * work cleanly during dev.
 */
export function stripeEnabled(): boolean {
  return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
}

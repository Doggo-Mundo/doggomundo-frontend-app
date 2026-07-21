export type SubscriptionStatus =
  | "active"
  | "paused"
  | "cancelled"
  | "past_due";

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: "Activa",
  paused: "Pausada",
  cancelled: "Cancelada",
  past_due: "Pago pendiente",
};

export type BillingInterval = "monthly" | "quarterly";

export const BILLING_INTERVAL_LABEL: Record<BillingInterval, string> = {
  monthly: "Mensual",
  quarterly: "Trimestral",
};

export type CycleStatus = "open" | "closed";

export const CYCLE_STATUS_LABEL: Record<CycleStatus, string> = {
  open: "Abierto",
  closed: "Cerrado",
};

export interface PlanEntitlement {
  service: string;
  service_name: string;
  quantity_per_cycle: number;
}

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: string;
  billing_interval: BillingInterval;
  billing_interval_display: string;
  terms: string;
  entitlements: PlanEntitlement[];
  /** True when the plan is wired to a Stripe Price and the subscribe
   *  flow needs to capture a payment method before submitting. */
  requires_payment_method: boolean;
  /** F-B: descuento % que se aplica al total de checkouts retail
   *  cuando el cliente tiene subscription ACTIVE a este plan.
   *  "0.00" cuando el plan no tiene beneficio de tienda. */
  retail_discount_percentage: string;
}

export interface EntitlementBalance {
  id: string;
  service: string;
  service_name: string;
  included_qty: number;
  used_qty: number;
  remaining_qty: number;
}

export interface Subscription {
  id: string;
  plan: string;
  plan_name: string;
  /** F-B: descuento % en tienda del plan asociado. "0.00" cuando no
   *  aplica. Precalculado por el backend para no cruzar catálogo. */
  plan_retail_discount_percentage: string;
  status: SubscriptionStatus;
  status_display: string;
  start_date: string;
  current_period_start: string;
  current_period_end: string;
  /** F6-A: ISO datetime when Stripe will cancel the sub. Null when
   *  there's no pending cancellation. Sub can still be ACTIVE with
   *  this set — the customer keeps benefits until cancels_at. */
  cancels_at: string | null;
  active_balances: EntitlementBalance[];
  cycles_count: number;
  created_at: string;
}

export interface SubscriptionCycle {
  id: string;
  period_start: string;
  period_end: string;
  status: CycleStatus;
  status_display: string;
  invoiced_at: string | null;
  balances: EntitlementBalance[];
}

export interface SubscribePayload {
  plan: string;
  /** Required when plan.requires_payment_method is true. Omitted for
   *  legacy / manual plans. */
  stripe_payment_method_id?: string;
}

export interface MySubscriptionsParams {
  /** Omit to get active + paused. Pass "cancelled" to see cancelled ones. */
  status?: SubscriptionStatus;
}

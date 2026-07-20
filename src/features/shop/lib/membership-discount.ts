import type { Subscription } from "@/types/membership";

/**
 * F-B: mirror del cálculo que hace el backend en
 * `orders/utils.py::_membership_retail_discount`. Del catálogo de subs
 * del cliente en estado ACTIVE, toma el `plan_retail_discount_percentage`
 * máximo (favorable al cliente si por alguna razón coexisten dos
 * planes activos). Devuelve 0 si no aplica.
 *
 * La fuente de verdad sigue siendo el backend — este helper solo
 * se usa para pintar el chip y el "total con descuento" en la fase
 * de review, antes de que el `create_order_from_cart` corra. Al
 * momento del checkout, la orden persistida trae `discounts_total`
 * y ese debe usarse a partir de ahí.
 */
export function selectRetailDiscountPct(
  subscriptions: Subscription[] | undefined,
): number {
  if (!subscriptions?.length) return 0;
  let best = 0;
  for (const sub of subscriptions) {
    if (sub.status !== "active") continue;
    const pct = Number(sub.plan_retail_discount_percentage ?? 0);
    if (!Number.isFinite(pct)) continue;
    if (pct > best) best = pct;
  }
  return best;
}

export function computeDiscount(
  gross: number,
  pct: number,
): { discount: number; net: number } {
  if (!pct || gross <= 0) return { discount: 0, net: gross };
  const raw = gross * (pct / 100);
  const discount = Math.round(raw * 100) / 100;
  const net = Math.max(0, Math.round((gross - discount) * 100) / 100);
  return { discount, net };
}

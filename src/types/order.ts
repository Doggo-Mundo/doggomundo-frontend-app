export type OrderStatus = "draft" | "paid" | "void";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  draft: "Pendiente",
  paid: "Pagada",
  void: "Anulada",
};

export type OrderLineType = "service" | "product" | "membership";

export const ORDER_LINE_TYPE_LABEL: Record<OrderLineType, string> = {
  service: "Servicio",
  product: "Producto",
  membership: "Membresía",
};

export interface OrderLine {
  id: string;
  line_type: OrderLineType;
  service: string | null;
  service_name: string | null;
  product: string | null;
  product_name: string | null;
  description_snapshot: string;
  quantity: string;
  unit_price: string;
  line_total: string;
  /** F-fix: true cuando el item fue redimido por un
   *  EntitlementBalance de una membresía activa. La UI muestra un
   *  chip "Cubierto por membresía" en vez de solo el precio. */
  covered_by_membership: boolean;
}

/** F-fix: summary de cuánto de la orden fue cubierto por membresía
 *  vs cobrado al cliente. Emitido por el backend para todos los
 *  Orders. Cuando no hay appointment/membresía involucrada, todos
 *  los counts vienen en 0. */
export interface MembershipCoverage {
  covered_lines_count: number;
  total_lines_count: number;
  covered_total_mxn: string;
  is_fully_covered: boolean;
  is_partially_covered: boolean;
}

/** F-D: cómo se pagó realmente esta orden. Viene del último
 *  Payment activo. Null cuando no hay Payment aún (draft pendiente
 *  de cobro) o cuando la orden fue anulada sin cobro. */
export type EffectivePaymentMethod =
  | "cash"
  | "card"
  | "transfer"
  | "online"
  | "external_terminal";

export interface OrderListItem {
  id: string;
  appointment: string | null;
  pet: string | null;
  status: OrderStatus;
  status_display: string;
  currency: string;
  /** Sticker price: subtotal + tax - discounts. NO refleja lo que el
   *  cliente pagó realmente cuando hay membresía involucrada. */
  total: string;
  /** F-fix: monto real cobrado (suma de Payments activos). Puede
   *  ser < `total` cuando la membresía cubre parcialmente. Igual a
   *  `total` en órdenes retail o citas sin cobertura. */
  charged_total_mxn: string;
  membership_coverage: MembershipCoverage;
  /** F-D: ver EffectivePaymentMethod. */
  effective_payment_method: EffectivePaymentMethod | null;
  paid_at: string | null;
  created_at: string;
}

export interface Order extends OrderListItem {
  subtotal: string;
  discounts_total: string;
  tax_total: string;
  notes: string;
  lines: OrderLine[];
  updated_at: string;
}

export interface OrderListParams {
  page?: number;
  status?: OrderStatus;
}

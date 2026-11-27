export type FulfillmentType = "stocked" | "dropship" | "service";

export const FULFILLMENT_TYPE_LABEL: Record<FulfillmentType, string> = {
  stocked: "Stock propio",
  dropship: "Dropshipping",
  service: "Producto-servicio",
};

export interface ProductCategory {
  id: string;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  category_name: string;
  description: string;
  price: string;
  photo: string | null;
  fulfillment_type: FulfillmentType;
  fulfillment_type_display: string;
  is_addon_offering: boolean;
  /** true cuando al menos una sucursal activa tiene stock. */
  in_stock: boolean;
  /** Máximo de unidades que se pueden pedir en UNA sola sucursal
   *  (un pedido se recoge en una sucursal). 0 = agotado. */
  max_available: number;
  /** Solo en el detalle (`GET /retail/products/{id}/`): una fila por
   *  sucursal activa. */
  availability?: ProductLocationAvailability[];
}

export interface ProductLocationAvailability {
  location_id: string;
  location_name: string;
  available: number;
}

export interface ProductListParams {
  category?: string;
  // F4-D. Query param that the backend understands as truthy when
  // the string equals "true"/"1"/"yes" (case-insensitive) — see
  // retail/views.py::_is_truthy_param.
  addons_only?: boolean;
}

// -----------------------------------------------------------------------------
// Checkout (F4-B / F4-C)
// -----------------------------------------------------------------------------

export interface CheckoutRequestItem {
  product_id: string;
  quantity: number;
}

// -----------------------------------------------------------------------------
// Cart availability (POST /retail/cart/availability/)
// -----------------------------------------------------------------------------

export interface CartAvailabilityMissing {
  product_id: string;
  product_name: string;
  requested: number;
  available: number;
}

export interface CartAvailabilityLocation {
  id: string;
  name: string;
  address: string;
  /** true = la sucursal tiene TODO el carrito en las cantidades pedidas. */
  can_fulfill: boolean;
  missing: CartAvailabilityMissing[];
}

export interface CartAvailabilityItem {
  product_id: string;
  product_name: string;
  requested: number;
  /** Máximo pedible en una sola sucursal. */
  max_available: number;
  /** Nombres de las sucursales que tienen la cantidad pedida. */
  available_at: string[];
}

export interface CartAvailabilityResponse {
  locations: CartAvailabilityLocation[];
  items: CartAvailabilityItem[];
}

export interface CheckoutRequest {
  items: CheckoutRequestItem[];
  pickup_location_id: string;
}

export interface CheckoutResponse {
  order_id: string;
  client_secret: string;
  /** F7-fix: Stripe Customer Session client_secret. Passed as
   *  `customerSessionClientSecret` in Elements options so the
   *  PaymentElement shows saved cards from previous flows
   *  (SetupIntents del wizard de citas, retail anterior). Empty
   *  string cuando Stripe rechazó la creación — el checkout sigue,
   *  solo sin el picker. */
  customer_session_client_secret: string;
  amount_total: string;
  currency: string;
}

export interface CheckoutOrderLine {
  product_id: string | null;
  description_snapshot: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export type CheckoutOrderStatus = "draft" | "paid" | "void";

/** Estado de preparación de un pedido para recoger en sucursal. "" =
 *  la orden no es de recoger (p. ej. orden de una cita). */
export type PickupStatus = "" | "pending" | "ready" | "picked_up";

export interface CheckoutOrder {
  id: string;
  status: CheckoutOrderStatus;
  subtotal: string;
  tax_total: string;
  total: string;
  paid_at: string | null;
  stock_hold_expires_at: string | null;
  lines: CheckoutOrderLine[];
  pickup_status: PickupStatus;
  pickup_status_display: string;
  location_name: string;
  location_address: string;
  ready_at: string | null;
  picked_up_at: string | null;
}

/**
 * Shape of the 400 body when the checkout endpoint rejects due to
 * insufficient stock. `detail` already comes as a customer-facing
 * sentence ("Solo queda 1 de “Kong” en Carso Palmas.") — render it
 * as-is.
 */
export interface OutOfStockDetail {
  detail: string;
  code: "out_of_stock";
  product_id: string;
  product_name: string;
  requested: number;
  available: number;
}

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
}

export interface ProductListParams {
  category?: string;
}

// -----------------------------------------------------------------------------
// Checkout (F4-B / F4-C)
// -----------------------------------------------------------------------------

export interface CheckoutRequestItem {
  product_id: string;
  quantity: number;
}

export interface CheckoutRequest {
  items: CheckoutRequestItem[];
  pickup_location_id: string;
}

export interface CheckoutResponse {
  order_id: string;
  client_secret: string;
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

export interface CheckoutOrder {
  id: string;
  status: CheckoutOrderStatus;
  subtotal: string;
  tax_total: string;
  total: string;
  paid_at: string | null;
  stock_hold_expires_at: string | null;
  lines: CheckoutOrderLine[];
}

/**
 * Shape of the 400 body when the checkout endpoint rejects due to
 * insufficient stock. The view assembles this via ValidationError
 * (payments/views.py) so we can render a targeted "Solo quedan N de
 * X" message with the exact product.
 */
export interface OutOfStockDetail {
  detail: string;
  product_id: string;
  product_name: string;
  requested: number;
  available: number;
}

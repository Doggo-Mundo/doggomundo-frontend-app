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
}

export interface OrderListItem {
  id: string;
  appointment: string | null;
  pet: string | null;
  status: OrderStatus;
  status_display: string;
  currency: string;
  total: string;
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

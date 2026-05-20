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

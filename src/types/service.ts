import type { BusinessUnitCode } from "./business-unit";

/** Valores en mayúsculas — igual que el TextChoices de Django
 *  (services.models.PricingMode), no un enum convencional en
 *  minúsculas. */
export type PricingMode = "FLAT" | "SIZE_COAT_MATRIX";

export interface ServiceCatalogItem {
  id: string;
  name: string;
  description: string;
  business_unit: string;
  business_unit_name: string;
  business_unit_code: BusinessUnitCode;
  base_duration_minutes: number;
  base_price: string;
  requires_pet: boolean;
  capacity_type: string;
  capacity_type_display: string;
  /** F-G.4: "FLAT" = usa base_price/base_duration_minutes tal cual;
   *  "SIZE_COAT_MATRIX" = el wizard debe cotizar vía
   *  GET /services/grooming/quote/ una vez que se sabe la mascota. */
  pricing_mode: PricingMode;
  pricing_mode_display: string;
  sort_order: number;
}

export type ServiceCatalog = ServiceCatalogItem;

export interface ServiceListParams {
  page?: number;
  business_unit?: string;
  business_unit_code?: BusinessUnitCode;
  search?: string;
  ordering?: string;
}

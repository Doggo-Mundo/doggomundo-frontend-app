import type { BusinessUnitCode } from "./business-unit";

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

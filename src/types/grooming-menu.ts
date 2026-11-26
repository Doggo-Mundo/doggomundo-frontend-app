import type { CoatType } from "./pet";

/** Respuesta de GET /services/grooming/menu/?business_unit=<uuid> —
 *  menú público de grooming por unidad de negocio. `packages[].id`
 *  es el mismo id del ServiceCatalog (pricing_mode=SIZE_COAT_MATRIX)
 *  que lista /services/catalog/, así que el paso de servicio puede
 *  cruzarlos para mostrar qué incluye cada paquete. */
export interface GroomingMenu {
  business_unit: { id: string; name: string };
  size_tiers: GroomingMenuSizeTier[];
  packages: GroomingMenuPackage[];
  deluxe: GroomingMenuDeluxe;
  extras: GroomingMenuExtra[];
}

export interface GroomingMenuSizeTier {
  id: string;
  name: string;
  min_weight_kg: string;
  max_weight_kg: string | null;
  height_description: string;
  example_breeds: string;
  sort_order: number;
}

export interface GroomingMenuFeature {
  id: string;
  title: string;
  description: string;
  /** true = solo se hace si el cliente lo pide (ej. "Corte de
   *  uñas si lo solicitas"). Se muestra con viñeta hueca. */
  on_request: boolean;
  sort_order: number;
}

export interface GroomingMenuPrice {
  id: string;
  size_tier: string;
  coat_type: CoatType | "";
  price: string;
  duration_minutes: number;
}

export interface GroomingMenuPackage {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  tagline: string;
  /** Paquete "base" que este incluye completo (ej. el corte incluye
   *  todo el baño). null cuando es el paquete de entrada. */
  includes_service: { id: string; name: string } | null;
  features: GroomingMenuFeature[];
  prices: GroomingMenuPrice[];
}

export interface GroomingMenuDeluxe {
  price_from: string | null;
  features: Omit<GroomingMenuFeature, "on_request">[];
  prices: { id: string; size_tier: string; price: string }[];
}

export interface GroomingMenuExtra {
  id: string;
  name: string;
  description: string;
  price_min: string;
  price_max: string;
  is_fixed_price: boolean;
  sort_order: number;
}

import type { CoatType } from "./pet";

/** F-G.4: respuesta de GET /services/grooming/quote/ — mismo shape
 *  que el endpoint de admin (ver AdminGroomingQuoteView en el
 *  backend). `total` = price + deluxe_price; los extras nunca se
 *  suman, son solo informativos. */
export interface GroomingQuote {
  service: string;
  size_tier: { id: string; name: string };
  coat_type: CoatType | "";
  coat_type_display: string | null;
  price: string;
  duration_minutes: number;
  deluxe_price: string | null;
  total: string;
  extras: GroomingQuoteExtra[];
}

export interface GroomingQuoteExtra {
  id: string;
  name: string;
  price_min: string;
  price_max: string;
  is_fixed_price: boolean;
}

export interface GroomingQuoteParams {
  service: string;
  pet: string;
  deluxe?: boolean;
}

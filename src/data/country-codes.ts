import type { FlagKey } from "@/components/decor/FlagIcon";

export interface CountryCode {
  code: string;
  label: string;
  flag: FlagKey;
}

// Lista curada, no exhaustiva — México primero y como default (audiencia
// principal de Doggo Mundo), más los mercados más probables después.
export const COUNTRY_CODES: CountryCode[] = [
  { code: "+52", label: "México", flag: "mx" },
  { code: "+1", label: "Estados Unidos / Canadá", flag: "us" },
  { code: "+502", label: "Guatemala", flag: "gt" },
  { code: "+501", label: "Belice", flag: "bz" },
  { code: "+34", label: "España", flag: "es" },
  { code: "+57", label: "Colombia", flag: "co" },
  { code: "+54", label: "Argentina", flag: "ar" },
  { code: "+56", label: "Chile", flag: "cl" },
  { code: "+51", label: "Perú", flag: "pe" },
];

export const DEFAULT_COUNTRY_CODE = COUNTRY_CODES[0].code;

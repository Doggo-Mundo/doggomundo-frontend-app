import type { GroomingMenuPackage } from "@/types/grooming-menu";

/** "$280" / "$1,250" / "$99.5" — es-MX sin ".00" de relleno. */
export function formatPesos(amount: number): string {
  return `$${amount.toLocaleString("es-MX", { maximumFractionDigits: 2 })}`;
}

/** Precio mínimo entre todos los tamaños/pelos del paquete, o null si
 *  el paquete todavía no tiene precios cargados. */
export function packagePriceFrom(pkg: GroomingMenuPackage): number | null {
  const prices = pkg.prices
    .map((p) => Number(p.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  return prices.length > 0 ? Math.min(...prices) : null;
}

/** "45 min" o "45–180 min" según el rango de duraciones del paquete. */
export function packageDurationLabel(pkg: GroomingMenuPackage): string | null {
  const durations = pkg.prices
    .map((p) => p.duration_minutes)
    .filter((n) => Number.isFinite(n) && n > 0);
  if (durations.length === 0) return null;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  return min === max ? `${min} min` : `${min}–${max} min`;
}

export function sortByOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

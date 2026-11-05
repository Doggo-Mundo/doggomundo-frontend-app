export interface BookingStep {
  key: string;
  index: number;
  path: string;
  label: string;
}

// F-G.4: "pet" va antes de "slot" — para cuando se muestran/generan
// horarios ya se conoce la duración real (servicios con calculadora
// de tamaño/pelo dependen de la mascota elegida). Ver
// docs/GROOMING_PRICING_CALCULATOR_PLAN.md §4.2, opción 1.
export const BOOKING_STEPS: BookingStep[] = [
  { key: "business-unit", index: 1, path: "/book/business-unit", label: "Tipo de servicio" },
  { key: "location", index: 2, path: "/book/location", label: "Sucursal" },
  { key: "service", index: 3, path: "/book/service", label: "Servicio" },
  { key: "pet", index: 4, path: "/book/pet", label: "Doggo" },
  // F-G extras-at-check-in: solo aparece cuando el servicio cotizó
  // (pricing_mode=size_coat_matrix) y el catálogo de la unidad trae
  // algún GroomingExtra activo — la página misma se auto-adelanta a
  // /book/slot cuando no aplica, mismo patrón que "addons" abajo.
  { key: "grooming-extras", index: 5, path: "/book/grooming-extras", label: "Opciones de grooming" },
  { key: "slot", index: 6, path: "/book/slot", label: "Fecha y hora" },
  // F4-D optional cross-sell step. The page itself auto-forwards to
  // /book/review when the location has zero add-on offerings, so
  // customers of sucursales without retail never see extra friction.
  { key: "addons", index: 7, path: "/book/addons", label: "Extras" },
  { key: "review", index: 8, path: "/book/review", label: "Confirmar" },
];

export const TOTAL_STEPS = BOOKING_STEPS.length;

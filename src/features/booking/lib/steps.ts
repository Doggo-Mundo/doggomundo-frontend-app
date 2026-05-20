export interface BookingStep {
  key: string;
  index: number;
  path: string;
  label: string;
}

export const BOOKING_STEPS: BookingStep[] = [
  { key: "business-unit", index: 1, path: "/book/business-unit", label: "Tipo de servicio" },
  { key: "location", index: 2, path: "/book/location", label: "Sucursal" },
  { key: "service", index: 3, path: "/book/service", label: "Servicio" },
  { key: "slot", index: 4, path: "/book/slot", label: "Fecha y hora" },
  { key: "pet", index: 5, path: "/book/pet", label: "Mascota" },
  { key: "review", index: 6, path: "/book/review", label: "Confirmar" },
];

export const TOTAL_STEPS = BOOKING_STEPS.length;

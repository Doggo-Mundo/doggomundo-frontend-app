export type BusinessUnitCode =
  | "AUTOLAVADO"
  | "GROOMING"
  | "FOTO"
  | "CAFE"
  | "VET"
  | "RETAIL"
  | "EXPERIENCIA";

export const BUSINESS_UNIT_LABEL: Record<BusinessUnitCode, string> = {
  AUTOLAVADO: "Autolavado",
  GROOMING: "Grooming profesional",
  FOTO: "Doggo Foto",
  CAFE: "Doggo Café",
  VET: "Veterinaria",
  RETAIL: "Tienda",
  EXPERIENCIA: "Experiencias",
};

export const BUSINESS_UNIT_DESCRIPTION: Record<BusinessUnitCode, string> = {
  AUTOLAVADO: "Baño rápido y eficiente",
  GROOMING: "Corte, estilo y cuidado a fondo",
  FOTO: "Cabina self-service para fotos",
  CAFE: "Pasa un rato con tu peludo",
  VET: "Consulta con nuestro veterinario",
  RETAIL: "Tienda de productos",
  EXPERIENCIA: "Actividades y eventos",
};

export const ALL_BUSINESS_UNITS: BusinessUnitCode[] = [
  "AUTOLAVADO",
  "GROOMING",
  "FOTO",
  "VET",
  "EXPERIENCIA",
  "CAFE",
  "RETAIL",
];

/**
 * Business units a customer can actually book through the wizard. CAFE and
 * RETAIL are walk-in / in-store only; EXPERIENCIA runs as events with its own
 * flow, not standard slot-based reservations.
 */
export const BOOKABLE_BUSINESS_UNITS: BusinessUnitCode[] = [
  "AUTOLAVADO",
  "GROOMING",
  "FOTO",
  "VET",
];

export type BusinessUnitCode =
  | "AUTOLAVADO"
  | "GROOMING"
  | "FOTO"
  | "CAFE"
  | "VET"
  | "RETAIL"
  | "EXPERIENCIA";

// AUTOLAVADO como TIPO de negocio agrupa las lavadoras — tanto las
// asistidas por staff ("Doggo Bath", bookable) como las pay-as-you-go
// del estacionamiento (no bookable). Para el cliente que reserva,
// "Autolavado" suena a "tú operas la máquina" y ahuyenta — el label
// usa el nombre comercial que ya identifican con el servicio staff.
export const BUSINESS_UNIT_LABEL: Record<BusinessUnitCode, string> = {
  AUTOLAVADO: "Doggo Bath",
  GROOMING: "Grooming profesional",
  FOTO: "Doggo Foto",
  CAFE: "Doggo Café",
  VET: "Alianza con Vet",
  RETAIL: "Tienda",
  EXPERIENCIA: "Experiencias",
};

export const BUSINESS_UNIT_DESCRIPTION: Record<BusinessUnitCode, string> = {
  AUTOLAVADO: "Baño asistido por nuestro equipo",
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

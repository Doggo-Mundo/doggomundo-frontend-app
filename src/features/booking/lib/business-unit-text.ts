import {
  BUSINESS_UNIT_DESCRIPTION,
  BUSINESS_UNIT_LABEL,
  type BusinessUnitCode,
} from "@/types/business-unit";
import type { Location } from "@/types/location";

export interface BusinessUnitText {
  label: string;
  description: string;
}

/**
 * Título y descripción de un tipo de unidad en el wizard: los que se
 * capturaron en el admin ("Nombre/Descripción para clientes"), o los
 * textos por default del tipo si ninguna unidad trae uno. Si varias
 * sucursales tienen ese tipo con textos distintos, gana la primera por
 * nombre de sucursal (orden estable).
 */
export function businessUnitText(
  code: BusinessUnitCode,
  locations: Pick<Location, "name" | "business_units">[] = [],
): BusinessUnitText {
  const units = [...locations]
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((loc) => loc.business_units.filter((bu) => bu.code === code));
  const label = units.map((u) => u.public_name?.trim()).find(Boolean);
  const description = units.map((u) => u.public_description?.trim()).find(Boolean);
  return {
    label: label || BUSINESS_UNIT_LABEL[code],
    description: description || BUSINESS_UNIT_DESCRIPTION[code],
  };
}

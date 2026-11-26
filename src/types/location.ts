import type { BusinessUnitCode } from "./business-unit";

export interface LocationBusinessUnit {
  id: string;
  name: string;
  code: BusinessUnitCode;
  code_display: string;
  /** Nombre/descripción para clientes, editables en el admin. Vacíos =
   *  textos por default del tipo (BUSINESS_UNIT_LABEL/DESCRIPTION). */
  public_name?: string;
  public_description?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  maps_url: string;
  business_units: LocationBusinessUnit[];
}

export type LocationListItem = Location;

export interface LocationListParams {
  page?: number;
}

export type Species = "DOG" | "CAT";
export type Gender = "MALE" | "FEMALE" | "UNKNOWN";
export type PetSize = "SMALL" | "MEDIUM" | "LARGE" | "X_LARGE";

/** Shape returned by /pets/breeds/, /pets/food-types/, /pets/food-brands/. */
export interface LookupOption {
  id: string;
  name: string;
  slug: string;
}

export interface Pet {
  id: string;
  name: string;
  species: Species | null;
  breed: LookupOption | null;
  birth_date: string | null;
  gender: Gender | null;
  food_type: LookupOption | null;
  food_brand: LookupOption | null;
  /** Legacy — kept in DB but not surfaced in the customer form. */
  size: PetSize | null;
  weight: string | null;
  microchip_id: string | null;
  photo: string | null;
  health_notes: string;
  allergies: string;
  age_years: number;
  onboarding_status: string;
  onboarding_completion_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PetListItem {
  id: string;
  name: string;
  species: Species | null;
  breed: LookupOption | null;
  gender: Gender | null;
  age_years: number;
  onboarding_status: string;
  onboarding_completion_percentage: number;
  photo: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PetListParams {
  page?: number;
  search?: string;
  is_active?: boolean;
}

/** species is auto-set to DOG by the backend, so the form never sends it. */
export interface CreatePetPayload {
  name: string;
  /** F-E.1: obligatorio en create (backend rechaza sin él). */
  size: PetSize;
  gender?: Gender;
  breed?: string;
  food_type?: string;
  food_brand?: string;
  birth_date?: string;
}

export interface UpdatePetBasicPayload {
  name?: string;
  /** F-E.1: opcional en update (backend permite omitir si el pet
   *  ya tenía uno; obligatorio si no lo tenía). */
  size?: PetSize;
  gender?: Gender;
  breed?: string;
  food_type?: string;
  birth_date?: string;
}

export interface UpdatePetCompletePayload {
  food_brand?: string;
  photo?: string;
  health_notes?: string;
  allergies?: string;
}

export type OnboardingLevel = "MINIMAL" | "BASIC" | "COMPLETE";

export interface OnboardingStatus {
  id: string;
  name: string;
  onboarding_status: OnboardingLevel;
  completion_percentage: number;
  missing_for_basic: string[];
  missing_for_complete: string[];
}

export interface MedicalRecord {
  id: string;
  pet: string;
  pet_name: string;
  record_type: string;
  record_type_display: string;
  title: string;
  description: string;
  date: string;
  veterinarian: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vaccination {
  id: string;
  pet: string;
  pet_name: string;
  vaccine_name: string;
  administered_date: string;
  next_due_date: string | null;
  batch_number: string;
  veterinarian: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** F-I: estado del pipeline VLM (Dog-ID) sobre una cartilla.
 *  El frontend polea el detail hasta que sea terminal (EXTRACTED
 *  /CONFIRMED/FAILED/MANUAL). */
export type VlmExtractionStatus =
  | "NOT_APPLICABLE"
  | "PENDING"
  | "PROCESSING"
  | "EXTRACTED"
  | "CONFIRMED"
  | "MANUAL"
  | "FAILED";

/** F-I: página adicional de un documento multi-hoja (cartilla). */
export interface MedicalDocumentPage {
  id: string;
  file: string;
  page_index: number;
}

export interface PetDocument {
  id: string;
  pet: string;
  document_type: string;
  document_type_display: string;
  file: string | null;
  /** F-I: páginas extra (cartillas multi-hoja). Vacía en docs de
   *  un solo archivo. */
  pages: MedicalDocumentPage[];
  description: string;
  uploaded_date: string;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  uploaded_by_user_type: string | null;
  vlm_extraction_status: VlmExtractionStatus;
  vlm_extraction_status_display: string;
  vlm_extracted_at: string | null;
  /** F-I: JSON crudo devuelto por Dog-ID; el form de confirmación
   *  lo consume para prellenar campos con badges de confianza. */
  vlm_raw_extraction: VlmRawExtraction | null;
  vlm_extraction_error: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** F-I: forma del JSON crudo que Dog-ID devuelve. Es el output del
 *  VLM más metadata de calibración; el frontend lo usa read-only
 *  para poblar la Caja 3. */
export interface VlmRawExtraction {
  posibles_multiples_perros?: boolean;
  paciente?: {
    nombre?: string | null;
    especie?: string | null;
    raza?: string | null;
    fecha_nacimiento?: string | null;
  };
  vacunas?: VlmExtractedVaccine[];
  proveedor?: string;
  modelo?: string;
  /** Metadata libre — puede contener duraciones, tokens, etc. */
  [key: string]: unknown;
}

export interface VlmExtractedVaccine {
  nombre_crudo?: string;
  fecha_aplicacion?: string | null;
  proxima_dosis?: string | null;
  confianza?: "alta" | "media" | "baja" | string;
  categoria?: string;
  /** VaccineType del backend cuando el VLM lo puede mapear. */
  tipo?: string;
}

/** F-I: enum de tipos de vacuna aceptados por el backend en
 *  confirm-cartilla. Debe mantenerse sincronizado con
 *  pets.models.VaccineType. */
export type VaccineType =
  | "RABIA"
  | "MOQUILLO"
  | "PARVOVIRUS"
  | "LEPTOSPIROSIS"
  | "BORDETELLA"
  | "HEPATITIS"
  | "PARAINFLUENZA"
  | "TRIPLE_FELINA"
  | "LEUCEMIA_FELINA"
  | "OTRO";

export const VACCINE_TYPE_LABEL: Record<VaccineType, string> = {
  RABIA: "Rabia",
  MOQUILLO: "Moquillo",
  PARVOVIRUS: "Parvovirus",
  LEPTOSPIROSIS: "Leptospirosis",
  BORDETELLA: "Bordetella",
  HEPATITIS: "Hepatitis",
  PARAINFLUENZA: "Parainfluenza",
  TRIPLE_FELINA: "Triple Felina",
  LEUCEMIA_FELINA: "Leucemia Felina",
  OTRO: "Otro",
};

/** F-I: payload de una vacuna confirmada — lo que el usuario acepta
 *  en la Caja 3 (o digita a mano si el VLM falló). */
export interface ConfirmedVaccinationInput {
  vaccine_name: string;
  vaccine_type: VaccineType;
  administered_date: string;
  next_due_date?: string | null;
  vet_name?: string;
  vet_clinic?: string;
  batch_number?: string;
}

export interface ConfirmCartillaPayload {
  vaccinations: ConfirmedVaccinationInput[];
}

export const SPECIES_LABEL: Record<Species, string> = {
  DOG: "Perro",
  CAT: "Gato",
};

export const GENDER_LABEL: Record<Gender, string> = {
  MALE: "Macho",
  FEMALE: "Hembra",
  UNKNOWN: "Sin especificar",
};

export const SIZE_LABEL: Record<PetSize, string> = {
  SMALL: "Pequeño",
  MEDIUM: "Mediano",
  LARGE: "Grande",
  X_LARGE: "Muy grande",
};

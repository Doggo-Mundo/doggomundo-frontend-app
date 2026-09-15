import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  Pet,
  PetListItem,
  PetListParams,
  CreatePetPayload,
  LookupOption,
  UpdatePetBasicPayload,
  UpdatePetCompletePayload,
  OnboardingStatus,
  MedicalRecord,
  Vaccination,
  PetDocument,
  ConfirmCartillaPayload,
} from "@/types/pet";

export const petKeys = {
  all: ["pets"] as const,
  lists: () => [...petKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...petKeys.lists(), params] as const,
  details: () => [...petKeys.all, "detail"] as const,
  detail: (id: string) => [...petKeys.details(), id] as const,
  onboarding: (id: string) => [...petKeys.all, "onboarding", id] as const,
  medical: (id: string) => [...petKeys.all, "medical", id] as const,
  vaccinations: (id: string) => [...petKeys.all, "vaccinations", id] as const,
  documents: (id: string) => [...petKeys.all, "documents", id] as const,
  document: (petId: string, docId: string) =>
    [...petKeys.all, "documents", petId, docId] as const,
  breeds: ["pets", "breeds"] as const,
  foodTypes: ["pets", "food-types"] as const,
  foodBrands: ["pets", "food-brands"] as const,
};

// Lookup catalogs are small and stable: fetch once and keep cached for the
// session so dropdowns open instantly across multiple forms.
const LOOKUP_STALE_TIME = 1000 * 60 * 60; // 1h

export function useBreeds() {
  return useQuery({
    queryKey: petKeys.breeds,
    queryFn: () => api.get<LookupOption[]>("/pets/breeds/").then((r) => r.data),
    staleTime: LOOKUP_STALE_TIME,
  });
}

/**
 * F-E.2: crea una raza custom cuando el cliente no encuentra la
 * suya en el catálogo. El backend hace dedupe case-insensitive +
 * sin diacríticos: si ya existe una equivalente devuelve la
 * existente en 200; si crea una nueva responde 201 con
 * `is_user_created=true`. En ambos casos el frontend usa la id
 * devuelta para setear el campo `breed` del pet.
 *
 * onSuccess actualiza optimísticamente el cache de useBreeds
 * (agrega la raza al array) para que reaparezca inmediatamente
 * en el picker sin refetch — evita el flash del combobox.
 */
export function useCreateBreed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api
        .post<LookupOption>("/pets/breeds/", { name })
        .then((r) => r.data),
    onSuccess: (created) => {
      qc.setQueryData<LookupOption[]>(petKeys.breeds, (prev) => {
        if (!prev) return [created];
        if (prev.some((b) => b.id === created.id)) return prev;
        // Insert al final — el usuario acaba de crearla, sabe que
        // no está en su orden alfabético natural del catálogo.
        return [...prev, created];
      });
    },
  });
}

export function useFoodTypes() {
  return useQuery({
    queryKey: petKeys.foodTypes,
    queryFn: () =>
      api.get<LookupOption[]>("/pets/food-types/").then((r) => r.data),
    staleTime: LOOKUP_STALE_TIME,
  });
}

export function useFoodBrands() {
  return useQuery({
    queryKey: petKeys.foodBrands,
    queryFn: () =>
      api.get<LookupOption[]>("/pets/food-brands/").then((r) => r.data),
    staleTime: LOOKUP_STALE_TIME,
  });
}

export function usePets(params: PetListParams = {}) {
  return useQuery({
    queryKey: petKeys.list(params as Record<string, unknown>),
    queryFn: () =>
      api
        .get<PaginatedResponse<PetListItem>>("/pets/", { params })
        .then((r) => r.data),
  });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: petKeys.detail(id),
    queryFn: () => api.get<Pet>(`/pets/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePetPayload) =>
      api.post<Pet>("/pets/create/", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}

export function useUpdatePetBasic(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePetBasicPayload) =>
      api.patch<Pet>(`/pets/${id}/update-basic/`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.detail(id) });
      qc.invalidateQueries({ queryKey: petKeys.onboarding(id) });
      qc.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}

export function useUpdatePetComplete(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePetCompletePayload) =>
      api.patch<Pet>(`/pets/${id}/update-complete/`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.detail(id) });
      qc.invalidateQueries({ queryKey: petKeys.onboarding(id) });
      qc.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}

export function useDeletePet(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete(`/pets/${id}/delete/`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.lists() });
      qc.removeQueries({ queryKey: petKeys.detail(id) });
    },
  });
}

export function useUpdatePetPhoto(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      return api
        .patch<Pet>(`/pets/${id}/update-complete/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.detail(id) });
      qc.invalidateQueries({ queryKey: petKeys.onboarding(id) });
      qc.invalidateQueries({ queryKey: petKeys.lists() });
    },
  });
}

export function usePetOnboardingStatus(id: string) {
  return useQuery({
    queryKey: petKeys.onboarding(id),
    queryFn: () =>
      api
        .get<OnboardingStatus>(`/pets/${id}/onboarding-status/`)
        .then((r) => r.data),
    enabled: !!id,
  });
}

export function usePetMedicalRecords(petId: string) {
  return useQuery({
    queryKey: petKeys.medical(petId),
    queryFn: () =>
      api
        .get<PaginatedResponse<MedicalRecord>>(`/pets/${petId}/medical-records/`)
        .then((r) => r.data),
    enabled: !!petId,
  });
}

export function usePetVaccinations(petId: string) {
  return useQuery({
    queryKey: petKeys.vaccinations(petId),
    queryFn: () =>
      api
        .get<PaginatedResponse<Vaccination>>(`/pets/${petId}/vaccinations/`)
        .then((r) => r.data),
    enabled: !!petId,
  });
}

export function usePetDocuments(petId: string) {
  return useQuery({
    queryKey: petKeys.documents(petId),
    queryFn: () =>
      api
        .get<PaginatedResponse<PetDocument>>(`/pets/${petId}/documents/`)
        .then((r) => r.data),
    enabled: !!petId,
  });
}

/**
 * F-F.3: subir un documento (foto/PDF) para un pet. Usado en el
 * setup del walk-in para la cartilla de vacunación, y también
 * desde la sección de documentos del pet.
 *
 * `document_type` es el enum del backend (CARTILLA_VACUNACION,
 * RECETA, etc.). El backend setea `uploaded_by=request.user`
 * automáticamente vía PetNestedMixin.
 */
/** F-I: máximo total de archivos por documento (file + extras).
 *  Debe mantenerse sincronizado con backend `MAX_DOCUMENT_PAGES`. */
export const MAX_DOCUMENT_PAGES = 5;

export interface UploadPetDocumentInput {
  document_type: string;
  /** Primera página / archivo principal. Obligatorio. */
  file: File;
  /** F-I: páginas extra (cartillas multi-hoja). El total
   *  file + additional_files no puede exceder MAX_DOCUMENT_PAGES. */
  additional_files?: File[];
  description?: string;
}

export function useUploadPetDocument(petId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UploadPetDocumentInput) => {
      const formData = new FormData();
      formData.append("document_type", input.document_type);
      formData.append("file", input.file);
      if (input.description) {
        formData.append("description", input.description);
      }
      // DRF ListField(child=FileField) espera múltiples entradas
      // con la misma key. FormData permite esto con append repetido.
      (input.additional_files ?? []).forEach((f) => {
        formData.append("additional_files", f);
      });
      return api
        .post<PetDocument>(
          `/pets/${petId}/documents/`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        )
        .then((r) => r.data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.documents(petId) });
    },
  });
}

/** F-I: detail de un documento con opción de polling.
 *
 *  Cuando el pipeline VLM está corriendo (PENDING/PROCESSING),
 *  el componente pasa `poll: true` y este hook refetchea cada 3s
 *  hasta que el status sea terminal. Al llegar a EXTRACTED/FAILED
 *  el `refetchInterval` devuelve false y el polling para. */
export function usePetDocument(
  petId: string,
  docId: string,
  opts: { poll?: boolean } = {},
) {
  return useQuery({
    queryKey: petKeys.document(petId, docId),
    queryFn: () =>
      api
        .get<PetDocument>(`/pets/${petId}/documents/${docId}/`)
        .then((r) => r.data),
    enabled: !!petId && !!docId,
    refetchInterval: (query) => {
      if (!opts.poll) return false;
      const data = query.state.data;
      const status = data?.vlm_extraction_status;
      const inFlight = status === "PENDING" || status === "PROCESSING";
      return inFlight ? 3000 : false;
    },
  });
}

/** F-I: reintenta el pipeline VLM sobre una cartilla en estado
 *  FAILED (o PENDING atascada). Devuelve el doc con status=PENDING
 *  y arranca el thread background del backend. */
export function useRetryExtraction(petId: string, docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api
        .post<PetDocument>(
          `/pets/${petId}/documents/${docId}/retry-extraction/`,
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.document(petId, docId) });
      qc.invalidateQueries({ queryKey: petKeys.documents(petId) });
    },
  });
}

/** F-I: confirmar la cartilla — el frontend envía la lista final de
 *  vacunas (VLM prellenó, usuario editó, o digitó a mano si falló),
 *  el backend crea VaccinationRecords ligados al doc y marca el
 *  status como CONFIRMED. Idempotente en el backend. */
export function useConfirmCartilla(petId: string, docId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConfirmCartillaPayload) =>
      api
        .post<Vaccination[]>(
          `/pets/${petId}/documents/${docId}/confirm-cartilla/`,
          payload,
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: petKeys.document(petId, docId) });
      qc.invalidateQueries({ queryKey: petKeys.documents(petId) });
      qc.invalidateQueries({ queryKey: petKeys.vaccinations(petId) });
    },
  });
}

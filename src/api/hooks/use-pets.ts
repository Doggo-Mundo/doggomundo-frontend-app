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
export interface UploadPetDocumentInput {
  document_type: string;
  file: File;
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

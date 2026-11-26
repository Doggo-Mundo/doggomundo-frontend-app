import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  Appointment,
  AppointmentListItem,
  AppointmentListParams,
  AvailabilityParams,
  AvailabilityResponse,
  CreateAppointmentPayload,
  RescheduleAppointmentPayload,
} from "@/types/appointment";

export const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (params: Record<string, unknown>) =>
    [...appointmentKeys.lists(), params] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  availability: (params: Record<string, unknown>) =>
    [...appointmentKeys.all, "availability", params] as const,
};

export function useMyAppointments(params: AppointmentListParams = {}) {
  return useQuery({
    queryKey: appointmentKeys.list(params as Record<string, unknown>),
    queryFn: () =>
      api
        .get<PaginatedResponse<AppointmentListItem>>("/appointments/", {
          params,
        })
        .then((r) => r.data),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () =>
      api.get<Appointment>(`/appointments/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

function fetchAvailability(params: AvailabilityParams) {
  return api
    .get<AvailabilityResponse>("/appointments/availability/", {
      params: {
        service: params.service,
        date: params.date,
        pet: params.pet || undefined,
      },
    })
    .then((r) => r.data);
}

/**
 * Inicios reservables de un servicio en un día local (CDMX), ya con la
 * duración real para la mascota (servicios de calculadora de tamaño/
 * pelo). `params` null deja la query deshabilitada. Sin retry: un 400
 * `pet_missing_data` no se arregla reintentando.
 */
export function useAvailability(params: AvailabilityParams | null) {
  return useQuery({
    queryKey: appointmentKeys.availability(
      (params ?? {}) as unknown as Record<string, unknown>,
    ),
    queryFn: () => fetchAvailability(params!),
    enabled: !!params?.service && !!params?.date,
    staleTime: 30 * 1000,
    retry: false,
  });
}

/**
 * Misma consulta que `useAvailability` pero para varias mascotas a la
 * vez (sugerencias "¿aprovechas la visita?" del paso de confirmación):
 * cada mascota puede tener una duración distinta, así que cada una
 * necesita su propia disponibilidad.
 */
export function useAvailabilityForPets(
  base: Omit<AvailabilityParams, "pet"> | null,
  petIds: string[],
) {
  return useQueries({
    queries: petIds.map((pet) => {
      const params = base ? { ...base, pet } : null;
      return {
        queryKey: appointmentKeys.availability(
          (params ?? {}) as unknown as Record<string, unknown>,
        ),
        queryFn: () => fetchAvailability(params!),
        enabled: !!params,
        staleTime: 30 * 1000,
        retry: false,
      };
    }),
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentPayload) =>
      api.post<Appointment>("/appointments/", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

export function useUpdateMyAppointment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: RescheduleAppointmentPayload) =>
      api
        .patch<Appointment>(`/appointments/${id}/update/`, data)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

interface CancelAppointmentVariables {
  /**
   * Required to be `true` when the appointment is inside the late-cancel
   * window — the backend rejects late cancels without explicit
   * acknowledgement so a stray double-click can't trigger a penalty.
   */
  acknowledgePenalty?: boolean;
}

export function useCancelMyAppointment(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ acknowledgePenalty }: CancelAppointmentVariables = {}) =>
      api
        .post(
          `/appointments/${id}/cancel/`,
          acknowledgePenalty ? { acknowledge_penalty: true } : {},
        )
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

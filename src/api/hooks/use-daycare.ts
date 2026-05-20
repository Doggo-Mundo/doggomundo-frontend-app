import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, differenceInDays, parseISO } from "date-fns";
import { api } from "@/api/client";
import type { PaginatedResponse } from "@/types/api";
import type {
  AvailabilityParams,
  CancelDayPayload,
  CreateDaysPayload,
  CreateEnrollmentPayload,
  DayAvailability,
  DaycareDay,
  DaycareDayListItem,
  DaycareDayWithExtras,
  DaycareEnrollment,
  DaycareEnrollmentList,
  DaycarePlan,
  DaysListParams,
  PetDayCareProfile,
} from "@/types/daycare";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const daycareKeys = {
  all: ["daycare"] as const,

  plans: () => [...daycareKeys.all, "plans"] as const,
  plan: (id: string) => [...daycareKeys.plans(), id] as const,

  petProfiles: () => [...daycareKeys.all, "pet-profiles"] as const,
  petProfile: (petId: string) => [...daycareKeys.petProfiles(), petId] as const,

  enrollments: () => [...daycareKeys.all, "enrollments"] as const,
  enrollment: (id: string) => [...daycareKeys.enrollments(), id] as const,

  availability: (params: AvailabilityParams) =>
    [...daycareKeys.all, "availability", params] as const,

  days: () => [...daycareKeys.all, "days"] as const,
  daysList: (params: DaysListParams) =>
    [...daycareKeys.days(), "list", params] as const,
  day: (id: string) => [...daycareKeys.days(), "detail", id] as const,
};

// ---------------------------------------------------------------------------
// Plans (public catalog)
// ---------------------------------------------------------------------------

export function usePlans() {
  return useQuery({
    queryKey: daycareKeys.plans(),
    queryFn: () =>
      api
        .get<PaginatedResponse<DaycarePlan>>("/daycare/plans/")
        .then((r) => r.data),
  });
}

export function usePlan(id: string) {
  return useQuery({
    queryKey: daycareKeys.plan(id),
    queryFn: () =>
      api.get<DaycarePlan>(`/daycare/plans/${id}/`).then((r) => r.data),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Pet profile (evaluation gating)
// ---------------------------------------------------------------------------

export function usePetProfile(petId: string) {
  return useQuery({
    queryKey: daycareKeys.petProfile(petId),
    queryFn: () =>
      api
        .get<PetDayCareProfile>(`/daycare/pets/${petId}/profile/`)
        .then((r) => r.data),
    enabled: !!petId,
    // The customer may come back after the admin acted on the evaluation —
    // refresh on focus so the new status shows up without a manual reload.
    refetchOnWindowFocus: true,
  });
}

export function useRequestEvaluation(petId: string) {
  const qc = useQueryClient();
  return useMutation({
    // Idempotent — backend returns 200 if no-op, 201 if profile was created.
    mutationFn: () =>
      api
        .post<PetDayCareProfile>(
          `/daycare/pets/${petId}/request-evaluation/`,
        )
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.setQueryData(daycareKeys.petProfile(petId), data);
    },
  });
}

// ---------------------------------------------------------------------------
// Enrollments
// ---------------------------------------------------------------------------

export function useEnrollments() {
  return useQuery({
    queryKey: daycareKeys.enrollments(),
    queryFn: () =>
      api
        .get<PaginatedResponse<DaycareEnrollmentList>>("/daycare/enrollments/")
        .then((r) => r.data),
  });
}

export function useEnrollment(id: string) {
  return useQuery({
    queryKey: daycareKeys.enrollment(id),
    queryFn: () =>
      api
        .get<DaycareEnrollment>(`/daycare/enrollments/${id}/`)
        .then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateEnrollment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEnrollmentPayload) =>
      api
        .post<DaycareEnrollment>("/daycare/enrollments/", data)
        .then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: daycareKeys.enrollments() });
      qc.setQueryData(daycareKeys.enrollment(data.id), data);
    },
  });
}

// ---------------------------------------------------------------------------
// Availability — with automatic 31-day chunking
// ---------------------------------------------------------------------------

const MAX_AVAILABILITY_RANGE_DAYS = 31;

function chunkDateRange(
  fromISO: string,
  toISO: string,
  maxDays: number,
): Array<{ date_from: string; date_to: string }> {
  const from = parseISO(fromISO);
  const to = parseISO(toISO);
  const total = differenceInDays(to, from) + 1;

  if (total <= maxDays) {
    return [{ date_from: fromISO, date_to: toISO }];
  }

  const chunks: Array<{ date_from: string; date_to: string }> = [];
  let cursor = from;
  while (cursor <= to) {
    const chunkEnd = addDays(cursor, maxDays - 1);
    const actualEnd = chunkEnd > to ? to : chunkEnd;
    chunks.push({
      date_from: toISODate(cursor),
      date_to: toISODate(actualEnd),
    });
    cursor = addDays(actualEnd, 1);
  }
  return chunks;
}

function toISODate(d: Date): string {
  // YYYY-MM-DD in UTC slice — the inputs are already date-only ISO,
  // so date-fns ops keep us aligned without timezone drift.
  return d.toISOString().slice(0, 10);
}

/**
 * Fetch availability for an arbitrary date range. The backend caps each
 * request at 31 days; this hook splits longer ranges into parallel chunks
 * and concatenates the results.
 *
 * Pass `null` to disable the query (e.g. while the user hasn't picked a
 * location yet).
 */
export function useAvailability(params: AvailabilityParams | null) {
  return useQuery({
    queryKey: daycareKeys.availability(
      params ?? { location: "", date_from: "", date_to: "" },
    ),
    queryFn: async (): Promise<DayAvailability[]> => {
      if (!params) return [];
      const chunks = chunkDateRange(
        params.date_from,
        params.date_to,
        MAX_AVAILABILITY_RANGE_DAYS,
      );
      const results = await Promise.all(
        chunks.map((chunk) =>
          api
            .get<DayAvailability[]>("/daycare/availability/", {
              params: { location: params.location, ...chunk },
            })
            .then((r) => r.data),
        ),
      );
      return results.flat();
    },
    enabled: !!params && !!params.location,
    // Availability changes when others book — short stale, but not zero.
    staleTime: 30 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Days (reservations)
// ---------------------------------------------------------------------------

export function useDays(params: DaysListParams = {}) {
  return useQuery({
    queryKey: daycareKeys.daysList(params),
    queryFn: () =>
      api
        .get<PaginatedResponse<DaycareDayListItem>>("/daycare/days/", {
          params,
        })
        .then((r) => r.data),
  });
}

export function useDay(id: string) {
  return useQuery({
    queryKey: daycareKeys.day(id),
    queryFn: () =>
      api
        .get<DaycareDayWithExtras>(`/daycare/days/${id}/`)
        .then((r) => normalizeDay(r.data)),
    enabled: !!id,
  });
}

/**
 * Defensive normalization: spectacular types `incidents` as `string` but the
 * backend really returns an array. If we somehow get a string, drop it.
 */
function normalizeDay(raw: DaycareDayWithExtras): DaycareDayWithExtras {
  return {
    ...raw,
    photos: Array.isArray(raw.photos) ? raw.photos : [],
    incidents: Array.isArray(raw.incidents) ? raw.incidents : [],
  };
}

/**
 * Reserve one or more days. All-or-nothing on the backend.
 *
 * Defends against both response shapes for now:
 *  - flat array (per the doc and per the backend implementation)
 *  - `{ results: [...] }` (current spectacular annotation; backend fix in flight)
 */
export function useCreateDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateDaysPayload): Promise<DaycareDay[]> => {
      const res = await api.post<
        DaycareDay[] | PaginatedResponse<DaycareDay>
      >("/daycare/days/", data);
      const body = res.data;
      if (Array.isArray(body)) return body;
      return body.results ?? [];
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: daycareKeys.days() });
      // Credits are consumed atomically — refresh enrollments too.
      qc.invalidateQueries({ queryKey: daycareKeys.enrollments() });
    },
  });
}

export function useCancelDay(dayId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CancelDayPayload = {}) =>
      api
        .post<DaycareDay>(`/daycare/days/${dayId}/cancel/`, data)
        .then((r) => r.data),
    onSuccess: () => {
      // The day moved to `cancelled`, the credit may have been refunded,
      // and the day list now shows different items in each tab.
      qc.invalidateQueries({ queryKey: daycareKeys.day(dayId) });
      qc.invalidateQueries({ queryKey: daycareKeys.days() });
      qc.invalidateQueries({ queryKey: daycareKeys.enrollments() });
    },
  });
}

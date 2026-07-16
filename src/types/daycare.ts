// ---------------------------------------------------------------------------
// Day Care — customer-facing types.
//
// All shapes mirror the live API (verified against /api/schema/). Two
// intentional deviations from drf-spectacular's emitted schema:
//
// 1. PetDayCareProfile.can_book is `boolean` here, but spectacular emits
//    `string` because the backend uses SerializerMethodField. The doc and
//    runtime are boolean; backend annotation fix in flight.
// 2. CustomerDayDetailWithExtras.incidents is `DayIncident[]` here, but
//    spectacular emits `string`. Same SerializerMethodField issue; we still
//    defend in the hook in case something arrives malformed.
// ---------------------------------------------------------------------------

// ---------- Enums ----------

export type PlanType =
  | "drop_in"
  | "punch_card"
  | "monthly_capped"
  | "monthly_unlimited";

export type EvaluationStatus =
  | "not_requested"
  | "pending"
  | "approved"
  | "conditional"
  | "rejected";

export type EnrollmentStatus =
  | "active"
  | "expired"
  | "cancelled"
  | "paused";

export type DayStatus =
  | "scheduled"
  | "checked_in"
  | "checked_out"
  | "no_show"
  | "cancelled";

export type IncidentType =
  | "injury"
  | "fight"
  | "escape_attempt"
  | "behavior"
  | "health"
  | "other";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

// ---------- DaycarePlan (public catalog) ----------

export interface DaycarePlan {
  id: string;
  name: string;
  description: string;
  plan_type: PlanType;
  plan_type_display: string;
  /** Decimal string, e.g. "450.00". */
  price: string;
  /** Null = unlimited. */
  credits_included: number | null;
  validity_days: number;
  auto_renewable: boolean;
  sort_order: number;
  /** True when the plan is wired to a Stripe Price; the purchase
   *  wizard must capture a card before submit. False = legacy path,
   *  server creates enrollment without a real charge. */
  requires_payment_method: boolean;
}

// ---------- PetDayCareProfile ----------

/**
 * `id` is null when the backend returns a "ghost" profile (no DB row yet).
 * All `*_at` fields are nullable in that case too.
 */
export interface PetDayCareProfile {
  id: string | null;
  pet: string;
  evaluation_status: EvaluationStatus;
  evaluation_status_display: string;
  evaluation_requested_at: string | null;
  evaluated_at: string | null;
  evaluation_notes: string;
  vaccination_check_passed: boolean;
  /**
   * True when evaluation_status is "approved" or "conditional".
   * Backend-computed; do not re-derive in UI.
   */
  can_book: boolean;
}

// ---------- DaycareEnrollment ----------

interface EnrollmentCommon {
  id: string;
  pet: string;
  pet_name: string;
  plan: string;
  plan_name: string;
  plan_type: PlanType;
  plan_type_display: string;
  /** Decimal string, e.g. "7500.00". */
  plan_price: string;
  status: EnrollmentStatus;
  status_display: string;
  /** Null = unlimited. */
  credits_remaining: number | null;
  is_unlimited: boolean;
  /** ISO date YYYY-MM-DD. */
  started_at: string;
  /** ISO date YYYY-MM-DD. */
  expires_at: string;
  auto_renew: boolean;
}

/** List shape from GET /enrollments/ — same shape as detail today. */
export type DaycareEnrollmentList = EnrollmentCommon;

export interface DaycareEnrollment extends EnrollmentCommon {
  order_id: string;
  order_status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEnrollmentPayload {
  pet: string;
  plan: string;
  location: string;
  /** Required when plan.requires_payment_method is true — the
   *  PaymentSection returns a Stripe pm_* on confirm and the
   *  wizard forwards it here. Omitted for legacy free plans. */
  stripe_payment_method_id?: string;
}

// ---------- Availability ----------

export interface DayAvailability {
  /** YYYY-MM-DD. */
  date: string;
  /** Null = closed. */
  capacity: number | null;
  booked: number;
  available: number;
  is_open: boolean;
}

export interface AvailabilityParams {
  location: string;
  /** YYYY-MM-DD. */
  date_from: string;
  /** YYYY-MM-DD. */
  date_to: string;
}

// ---------- DaycareDay ----------

interface DayCommon {
  id: string;
  pet: string;
  pet_name: string;
  location: string;
  location_name: string;
  /** YYYY-MM-DD. */
  date: string;
  /** "HH:MM:SS" or null. */
  expected_drop_off: string | null;
  /** "HH:MM:SS" or null. */
  expected_pick_up: string | null;
  status: DayStatus;
  status_display: string;
  is_evaluation: boolean;
  credit_consumed: boolean;
}

export type DaycareDayListItem = DayCommon;

export interface DaycareDay extends DayCommon {
  enrollment_id: string;
  /** ISO datetime UTC. */
  actual_drop_off: string | null;
  /** ISO datetime UTC. */
  actual_pick_up: string | null;
  /** Decimal string, e.g. "0.00". */
  late_pickup_fee: string;
  notes: string;
  cancelled_at: string | null;
  cancelled_reason: string;
  created_at: string;
}

export interface DayPhoto {
  id: string;
  /** Absolute URL. */
  image: string;
  caption: string;
  uploaded_by: string | null;
  uploaded_by_name: string;
  /** ISO datetime UTC. */
  created_at: string;
}

export interface DayIncident {
  id: string;
  incident_type: IncidentType;
  incident_type_display: string;
  severity: IncidentSeverity;
  severity_display: string;
  description: string;
  action_taken: string;
  /** ISO datetime UTC. */
  notified_at: string | null;
  /** ISO datetime UTC. */
  created_at: string;
}

/**
 * Detail of a customer-owned day, enriched with photos and the subset of
 * incidents the admin marked as `notified_owner=true`.
 */
export interface DaycareDayWithExtras extends DaycareDay {
  photos: DayPhoto[];
  incidents: DayIncident[];
}

export interface CreateDaysPayload {
  enrollment: string;
  pet: string;
  location: string;
  /** Array of YYYY-MM-DD. */
  dates: string[];
  /** Optional "HH:MM". */
  expected_drop_off?: string;
  /** Optional "HH:MM". */
  expected_pick_up?: string;
}

export interface CancelDayPayload {
  reason?: string;
}

export interface DaysListParams {
  upcoming?: boolean;
  date_from?: string;
  date_to?: string;
  pet?: string;
  status?: DayStatus;
}

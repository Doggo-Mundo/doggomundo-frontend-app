import type { AvailableSlot } from "@/types/appointment";

/**
 * Keep only slots the customer can actually book: backend-flagged as
 * `is_available` (not blocked by another appointment) and whose start time
 * is still in the future. Extracted from the component so `Date.now()` runs
 * outside `useMemo` and keeps the purity lint rule happy.
 */
export function filterBookableSlots(slots: AvailableSlot[]): AvailableSlot[] {
  const nowMs = Date.now();
  return slots.filter(
    (s) => s.is_available && new Date(s.start).getTime() > nowMs,
  );
}

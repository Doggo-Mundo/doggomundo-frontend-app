import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { filterBookableSlots } from "./filter-slots";
import type { AvailableSlot } from "@/types/appointment";

function makeSlot(
  id: string,
  start: string,
  is_available = true,
): AvailableSlot {
  return {
    id,
    business_unit: "bu-1",
    service: null,
    service_name: null,
    staff_user: null,
    resource: null,
    start,
    end: start,
    is_available,
  };
}

describe("filterBookableSlots", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides booked slots and past slots", () => {
    const available = makeSlot("a", "2026-05-10T14:00:00Z", true);
    const taken = makeSlot("b", "2026-05-10T15:00:00Z", false);
    const pastOpen = makeSlot("c", "2026-05-10T10:00:00Z", true);
    const futureBooked = makeSlot("d", "2026-05-10T16:00:00Z", false);

    const result = filterBookableSlots([available, taken, pastOpen, futureBooked]);

    expect(result.map((s) => s.id)).toEqual(["a"]);
  });

  it("returns [] on empty input", () => {
    expect(filterBookableSlots([])).toEqual([]);
  });
});

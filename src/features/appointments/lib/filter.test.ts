import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  findNextUpcoming,
  isTerminal,
  partitionAppointments,
} from "./filter";
import type {
  AppointmentListItem,
  AppointmentStatus,
} from "@/types/appointment";

function makeAppt(
  id: string,
  scheduled_start: string,
  status: AppointmentStatus = "scheduled",
): AppointmentListItem {
  return {
    id,
    business_unit: "bu-1",
    business_unit_name: "Grooming Polanco",
    pet: null,
    scheduled_start,
    scheduled_end: scheduled_start,
    status,
    status_display: status,
    channel: "web",
    created_at: scheduled_start,
  };
}

describe("isTerminal", () => {
  it("matches completed/cancelled/no_show", () => {
    expect(isTerminal("completed")).toBe(true);
    expect(isTerminal("cancelled")).toBe(true);
    expect(isTerminal("no_show")).toBe(true);
  });
  it("does not match live states", () => {
    expect(isTerminal("scheduled")).toBe(false);
    expect(isTerminal("checked_in")).toBe(false);
  });
});

describe("partitionAppointments", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("places future scheduled appointments in upcoming, sorted ascending", () => {
    const a = makeAppt("a", "2026-05-11T10:00:00Z");
    const b = makeAppt("b", "2026-05-12T10:00:00Z");
    const c = makeAppt("c", "2026-05-11T08:00:00Z");
    const { upcoming, past } = partitionAppointments([a, b, c]);
    expect(upcoming.map((x) => x.id)).toEqual(["c", "a", "b"]);
    expect(past).toHaveLength(0);
  });

  it("puts past and terminal statuses into past, sorted descending", () => {
    const past1 = makeAppt("past1", "2026-05-08T10:00:00Z");
    const cancelled = makeAppt(
      "cancelled",
      "2026-05-20T10:00:00Z",
      "cancelled",
    );
    const completed = makeAppt(
      "completed",
      "2026-05-09T10:00:00Z",
      "completed",
    );
    const { upcoming, past } = partitionAppointments([
      past1,
      cancelled,
      completed,
    ]);
    expect(upcoming).toHaveLength(0);
    // cancelled has the latest scheduled_start → first
    expect(past.map((x) => x.id)).toEqual(["cancelled", "completed", "past1"]);
  });
});

describe("findNextUpcoming", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the soonest non-terminal future appointment", () => {
    const a = makeAppt("a", "2026-05-11T10:00:00Z");
    const b = makeAppt("b", "2026-05-11T08:00:00Z");
    const c = makeAppt("c", "2026-05-20T10:00:00Z", "cancelled");
    expect(findNextUpcoming([a, b, c])?.id).toBe("b");
  });

  it("returns null when nothing upcoming", () => {
    const past = makeAppt("past", "2026-05-09T10:00:00Z");
    expect(findNextUpcoming([past])).toBeNull();
  });
});

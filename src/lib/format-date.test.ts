import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatRelativeAppointment,
  formatTime,
  isWithin24h,
  localDayBoundsUTC,
  toLocalDateISO,
} from "./format-date";

describe("formatTime", () => {
  it("renders UTC datetimes in Mexico City HH:mm", () => {
    // 2026-05-10T20:00:00Z is 14:00 in America/Mexico_City (CST, UTC-6)
    expect(formatTime("2026-05-10T20:00:00Z")).toBe("14:00");
  });
});

describe("toLocalDateISO", () => {
  it("returns the MX-local calendar date for a UTC instant", () => {
    // 2026-05-11T05:00:00Z is 2026-05-10 23:00 in MX — previous day
    const d = new Date("2026-05-11T05:00:00Z");
    expect(toLocalDateISO(d)).toBe("2026-05-10");
  });
});

describe("localDayBoundsUTC", () => {
  it("wraps a MX-local date in its UTC bounds", () => {
    const { startUTC, endUTC } = localDayBoundsUTC("2026-05-10");
    // MX is UTC-6 (no DST), so 2026-05-10T00:00 MX = 2026-05-10T06:00 UTC
    expect(startUTC).toBe("2026-05-10T06:00:00.000Z");
    // and 2026-05-10T23:59:59.999 MX = 2026-05-11T05:59:59.999 UTC
    expect(endUTC).toBe("2026-05-11T05:59:59.999Z");
  });
});

describe("isWithin24h", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is true for a moment 1h in the future", () => {
    expect(isWithin24h("2026-05-10T13:00:00Z")).toBe(true);
  });

  it("is true for a moment in the past", () => {
    expect(isWithin24h("2026-05-09T12:00:00Z")).toBe(true);
  });

  it("is false for a moment >24h away", () => {
    expect(isWithin24h("2026-05-11T13:00:00Z")).toBe(false);
  });

  it("is false at exactly 24h boundary", () => {
    expect(isWithin24h("2026-05-11T12:00:00Z")).toBe(false);
  });
});

describe("formatRelativeAppointment", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // NOW = 2026-05-10 12:00 UTC = 2026-05-10 06:00 MX (Sunday)
    vi.setSystemTime(new Date("2026-05-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("'Pasó' when the time is in the past", () => {
    expect(formatRelativeAppointment("2026-05-09T10:00:00Z")).toBe("Pasó");
  });

  it("'Ahora' within the first few minutes", () => {
    expect(formatRelativeAppointment("2026-05-10T12:02:00Z")).toBe("Ahora");
  });

  it("'En N min' within the next hour", () => {
    expect(formatRelativeAppointment("2026-05-10T12:30:00Z")).toBe("En 30 min");
  });

  it("includes MX-local time when within 24h", () => {
    // +5h UTC = 17:00 UTC = 11:00 MX
    expect(formatRelativeAppointment("2026-05-10T17:00:00Z")).toBe(
      "En 5 h · 11:00",
    );
  });

  it("'Mañana HH:mm' for the next calendar day", () => {
    // 2026-05-11T16:00 UTC = 2026-05-11 10:00 MX
    expect(formatRelativeAppointment("2026-05-11T16:00:00Z")).toBe(
      "Mañana 10:00",
    );
  });

  it("weekday label within the following week", () => {
    // 2026-05-15 Friday
    const out = formatRelativeAppointment("2026-05-15T16:00:00Z");
    expect(out).toMatch(/viernes 10:00/i);
  });

  it("absolute date when further out than a week", () => {
    // 2026-06-01 Monday
    const out = formatRelativeAppointment("2026-06-01T16:00:00Z");
    expect(out).toMatch(/1 de jun · 10:00/i);
  });
});

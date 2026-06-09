import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { AppointmentDetailPage } from "./AppointmentDetailPage";
import { renderWithProviders } from "@/test/test-utils";
import { server } from "@/test/msw-server";
import { makeAppointment, makePetListItem } from "@/test/fixtures";

const API = "http://localhost/api";
const NOW = new Date("2026-05-10T12:00:00Z");

function setupAppointment(appt = makeAppointment()) {
  server.use(
    http.get(`${API}/appointments/${appt.id}/`, () => HttpResponse.json(appt)),
    http.get(`${API}/pets/`, () =>
      HttpResponse.json({
        count: 1,
        next: null,
        previous: null,
        results: [makePetListItem()],
      }),
    ),
  );
  return appt;
}

describe("AppointmentDetailPage — cancel button rules", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("enables cancel when outside the cancellation window and status is scheduled", async () => {
    const appt = setupAppointment(
      makeAppointment({
        id: "a-future",
        scheduled_start: "2026-05-15T10:00:00Z", // +5 days
        status: "scheduled",
      }),
    );
    renderWithProviders(<AppointmentDetailPage />, {
      route: `/my/appointments/${appt.id}`,
      path: "/my/appointments/:id",
    });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /corte completo/i }),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", { name: /cancelar cita/i }),
    ).not.toBeDisabled();
  });

  it("disables cancel and shows the window notice when inside the window", async () => {
    const appt = setupAppointment(
      makeAppointment({
        id: "a-soon",
        // +8h from NOW — inside the 12h customer cancellation window.
        scheduled_start: "2026-05-10T20:00:00Z",
        status: "scheduled",
      }),
    );
    renderWithProviders(<AppointmentDetailPage />, {
      route: `/my/appointments/${appt.id}`,
      path: "/my/appointments/:id",
    });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /corte completo/i }),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", { name: /cancelar cita/i }),
    ).toBeDisabled();
    expect(
      screen.getByText(/falta menos de 12 horas/i),
    ).toBeInTheDocument();
  });

  it("hides cancel entirely on terminal status (cancelled)", async () => {
    const appt = setupAppointment(
      makeAppointment({
        id: "a-cancelled",
        scheduled_start: "2026-05-15T10:00:00Z",
        status: "cancelled",
        status_display: "Cancelada",
      }),
    );
    renderWithProviders(<AppointmentDetailPage />, {
      route: `/my/appointments/${appt.id}`,
      path: "/my/appointments/:id",
    });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /corte completo/i }),
      ).toBeInTheDocument(),
    );

    expect(
      screen.queryByRole("button", { name: /cancelar cita/i }),
    ).not.toBeInTheDocument();
  });

  it("disables cancel when status is checked_in (not cancellable by customer)", async () => {
    const appt = setupAppointment(
      makeAppointment({
        id: "a-checkedin",
        scheduled_start: "2026-05-15T10:00:00Z",
        status: "checked_in",
        status_display: "En curso",
      }),
    );
    renderWithProviders(<AppointmentDetailPage />, {
      route: `/my/appointments/${appt.id}`,
      path: "/my/appointments/:id",
    });

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /corte completo/i }),
      ).toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", { name: /cancelar cita/i }),
    ).toBeDisabled();
  });
});

describe("AppointmentDetailPage — pet name lookup", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("cross-references the pet from the pets query", async () => {
    const appt = setupAppointment(
      makeAppointment({ pet: "pet-1", scheduled_start: "2026-06-01T10:00:00Z" }),
    );
    renderWithProviders(<AppointmentDetailPage />, {
      route: `/my/appointments/${appt.id}`,
      path: "/my/appointments/:id",
    });

    await waitFor(() => expect(screen.getByText(/Nala/)).toBeInTheDocument());
  });
});

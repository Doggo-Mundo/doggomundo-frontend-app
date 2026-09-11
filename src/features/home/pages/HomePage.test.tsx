import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import { HomePage } from "./HomePage";
import { renderWithProviders } from "@/test/test-utils";
import { server } from "@/test/msw-server";
import {
  makeAppointmentListItem,
  makePetListItem,
} from "@/test/fixtures";
import { useAuthStore } from "@/stores/auth-store";
import { mockCustomerUser } from "@/test/msw-handlers";

const API = "http://localhost/api";

function paginated<T>(results: T[]) {
  return { count: results.length, next: null, previous: null, results };
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-05-10T12:00:00Z"));
    useAuthStore.setState({
      accessToken: "t",
      user: mockCustomerUser,
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    useAuthStore.getState().logout();
  });

  it("greets the user by first name", async () => {
    server.use(
      http.get(`${API}/pets/`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/appointments/`, () =>
        HttpResponse.json(paginated([])),
      ),
    );
    renderWithProviders(<HomePage />);
    expect(
      await screen.findByRole("heading", { name: /valentina/i }),
    ).toBeInTheDocument();
  });

  it("shows the onboarding banner when a pet has incomplete profile", async () => {
    server.use(
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(
          paginated([
            makePetListItem({
              id: "p-incomplete",
              name: "Nala",
              onboarding_completion_percentage: 40,
            }),
          ]),
        ),
      ),
      http.get(`${API}/appointments/`, () =>
        HttpResponse.json(paginated([])),
      ),
    );
    renderWithProviders(<HomePage />);

    // The banner now surfaces the first missing field. The default fixture
    // has no photo, so the hint should call that out specifically.
    expect(
      await screen.findByText(/súbele su foto de nala/i),
    ).toBeInTheDocument();
  });

  it("does not show the banner when all pets are 100%", async () => {
    server.use(
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(
          paginated([
            makePetListItem({ onboarding_completion_percentage: 100 }),
          ]),
        ),
      ),
      http.get(`${API}/appointments/`, () =>
        HttpResponse.json(paginated([])),
      ),
    );
    renderWithProviders(<HomePage />);
    await screen.findByRole("heading", { name: /valentina/i });
    expect(
      screen.queryByText(/completa el perfil/i),
    ).not.toBeInTheDocument();
  });

  it("surfaces the soonest upcoming appointment as 'Tu próxima cita'", async () => {
    server.use(
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(
          paginated([makePetListItem({ id: "pet-1", name: "Nala" })]),
        ),
      ),
      http.get(`${API}/appointments/`, () =>
        HttpResponse.json(
          paginated([
            makeAppointmentListItem({
              id: "far-future",
              scheduled_start: "2026-09-01T10:00:00Z",
            }),
            makeAppointmentListItem({
              id: "near-future",
              scheduled_start: "2026-05-12T10:00:00Z",
            }),
            makeAppointmentListItem({
              id: "past",
              scheduled_start: "2026-05-09T10:00:00Z",
              status: "completed",
              status_display: "Completada",
            }),
          ]),
        ),
      ),
    );
    renderWithProviders(<HomePage />);
    expect(
      await screen.findByText(/tu próxima cita/i),
    ).toBeInTheDocument();
    // Pet name comes from usePets cross-reference. After the home page
    // gained the PetShowcase strip below the hero, "Nala" can render in
    // multiple places — both should resolve to the same usePets lookup,
    // so we just assert it shows up at all.
    await waitFor(() =>
      expect(screen.getAllByText("Nala").length).toBeGreaterThan(0),
    );
  });

  it("shows the empty state when there are no upcoming appointments", async () => {
    server.use(
      http.get(`${API}/pets/`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/appointments/`, () =>
        HttpResponse.json(paginated([])),
      ),
    );
    renderWithProviders(<HomePage />);
    expect(
      await screen.findByText(/aún no tienes citas próximas/i),
    ).toBeInTheDocument();
  });

  it("hides the Memberships quick action when the plan catalog is empty", async () => {
    // Data-driven gating: sin planes cargados en el catálogo el
    // botón desaparece del home. Cuando el equipo dé de alta el
    // primero, aparece sin redeploy.
    server.use(
      http.get(`${API}/pets/`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/appointments/`, () =>
        HttpResponse.json(paginated([])),
      ),
      http.get(`${API}/memberships/plans/`, () => HttpResponse.json([])),
    );
    renderWithProviders(<HomePage />);
    // El resto de tiles siguen; solo el de membresías debe faltar.
    await screen.findByText(/mis mascotas/i);
    await waitFor(() =>
      expect(screen.queryByText(/^membresías$/i)).not.toBeInTheDocument(),
    );
  });

  it("shows the Memberships quick action when at least one plan exists", async () => {
    server.use(
      http.get(`${API}/pets/`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/appointments/`, () =>
        HttpResponse.json(paginated([])),
      ),
      http.get(`${API}/memberships/plans/`, () =>
        HttpResponse.json([
          {
            id: "plan-1",
            code: "PREMIUM",
            name: "Premium",
            price_mxn_cents: 49900,
            billing_cycle: "monthly",
            is_active: true,
          },
        ]),
      ),
    );
    renderWithProviders(<HomePage />);
    expect(
      await screen.findByText(/^membresías$/i),
    ).toBeInTheDocument();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { lazy, Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { server } from "@/test/msw-server";
import { makePetListItem } from "@/test/fixtures";
import { useBookingFlowStore } from "@/stores/booking-flow-store";
import { makeTestQueryClient } from "@/test/test-utils";

const API = "http://localhost/api";

// Lazy-import the booking pages so their internal `import "..."` chains resolve
// the same way they do in the real router.
const BookingLandingPage = lazy(() =>
  import("./pages/BookingLandingPage").then((m) => ({
    default: m.BookingLandingPage,
  })),
);
const BusinessUnitPickerPage = lazy(() =>
  import("./pages/BusinessUnitPickerPage").then((m) => ({
    default: m.BusinessUnitPickerPage,
  })),
);
const LocationPickerPage = lazy(() =>
  import("./pages/LocationPickerPage").then((m) => ({
    default: m.LocationPickerPage,
  })),
);
const ServicePickerPage = lazy(() =>
  import("./pages/ServicePickerPage").then((m) => ({
    default: m.ServicePickerPage,
  })),
);
const SlotPickerPage = lazy(() =>
  import("./pages/SlotPickerPage").then((m) => ({
    default: m.SlotPickerPage,
  })),
);
const PetPickerPage = lazy(() =>
  import("./pages/PetPickerPage").then((m) => ({
    default: m.PetPickerPage,
  })),
);
const AddOnsPickerPage = lazy(() =>
  import("./pages/AddOnsPickerPage").then((m) => ({
    default: m.AddOnsPickerPage,
  })),
);
const BookingReviewPage = lazy(() =>
  import("./pages/BookingReviewPage").then((m) => ({
    default: m.BookingReviewPage,
  })),
);

function paginated<T>(results: T[]) {
  return { count: results.length, next: null, previous: null, results };
}

function renderWizard(initial = "/book") {
  const queryClient = makeTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initial]}>
        <Suspense fallback={<div>loading</div>}>
          <Routes>
            <Route path="/book" element={<BookingLandingPage />} />
            <Route
              path="/book/business-unit"
              element={<BusinessUnitPickerPage />}
            />
            <Route path="/book/location" element={<LocationPickerPage />} />
            <Route path="/book/service" element={<ServicePickerPage />} />
            <Route path="/book/slot" element={<SlotPickerPage />} />
            <Route path="/book/pet" element={<PetPickerPage />} />
            <Route path="/book/addons" element={<AddOnsPickerPage />} />
            <Route path="/book/review" element={<BookingReviewPage />} />
            <Route
              path="/my/appointments"
              element={<div data-testid="appointments">Mis citas</div>}
            />
            <Route
              path="/pets/new"
              element={<div data-testid="pets-new">Alta mascota</div>}
            />
          </Routes>
        </Suspense>
        <Toaster />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Booking wizard — happy path", () => {
  beforeEach(() => {
    useBookingFlowStore.getState().reset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // Pin to a fixed morning so the DateStrip renders a known "today" and
    // the slot query window is deterministic.
    vi.setSystemTime(new Date("2030-06-01T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    useBookingFlowStore.getState().reset();
  });

  it("walks through BU → (auto-skip Location) → Service → Slot → Pet → Review and POSTs the nested payload", { timeout: 20000 }, async () => {
    let postedPayload: Record<string, unknown> | null = null;

    server.use(
      // Location picker
      http.get(`${API}/locations/`, () =>
        HttpResponse.json(
          paginated([
            {
              id: "loc-1",
              name: "Sucursal Polanco",
              address: "Av. Polanco 1",
              email: "polanco@doggo.mx",
              phone: "+5215512345678",
              maps_url: "",
              business_units: [
                {
                  id: "bu-grooming",
                  name: "Grooming Polanco",
                  code: "GROOMING",
                  code_display: "Grooming",
                },
              ],
            },
          ]),
        ),
      ),
      // Service picker (filters by business_unit)
      http.get(`${API}/services/catalog/`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("business_unit")).toBe("bu-grooming");
        return HttpResponse.json(
          paginated([
            {
              id: "srv-corte",
              name: "Corte completo",
              description: "",
              business_unit: "bu-grooming",
              business_unit_name: "Grooming Polanco",
              business_unit_code: "GROOMING",
              base_duration_minutes: 60,
              base_price: "450.00",
              requires_pet: true,
              capacity_type: "staff_based",
              capacity_type_display: "Por staff",
              sort_order: 0,
            },
          ]),
        );
      }),
      // Slot picker — query needs start_after/start_before + business_unit + service
      http.get(`${API}/appointments/slots/`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("business_unit")).toBe("bu-grooming");
        expect(url.searchParams.get("service")).toBe("srv-corte");
        return HttpResponse.json(
          paginated([
            {
              id: "slot-1",
              business_unit: "bu-grooming",
              service: "srv-corte",
              service_name: "Corte completo",
              staff_user: null,
              resource: "res-1",
              start: "2030-06-01T16:00:00Z",
              end: "2030-06-01T17:00:00Z",
              is_available: true,
            },
          ]),
        );
      }),
      // Pet picker
      http.get(`${API}/pets/`, () =>
        HttpResponse.json(
          paginated([
            makePetListItem({
              id: "pet-1",
              name: "Nala",
              onboarding_completion_percentage: 100,
            }),
          ]),
        ),
      ),
      // Add-ons picker (F4-D) — empty catalog triggers the page's
      // auto-forward to /book/review so this happy-path test doesn't
      // need to interact with the extras step.
      http.get(`${API}/retail/products/`, () => HttpResponse.json([])),
      // Create
      http.post(`${API}/appointments/`, async ({ request }) => {
        postedPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            id: "appt-new",
            business_unit: "bu-grooming",
            business_unit_name: "Grooming Polanco",
            pet: "pet-1",
            scheduled_start: "2030-06-01T16:00:00Z",
            scheduled_end: "2030-06-01T17:00:00Z",
            status: "scheduled",
            status_display: "Programada",
            channel: "web",
            notes: "",
            items: [],
            created_at: "2030-06-01T10:00:00Z",
            updated_at: "2030-06-01T10:00:00Z",
          },
          { status: 201 },
        );
      }),
    );

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderWizard("/book/business-unit");

    // Step 1: business unit
    await user.click(
      await screen.findByRole("button", { name: /grooming profesional/i }),
    );

    // Step 2 (location) is auto-skipped because the system has exactly
    // one sucursal — the wizard lands directly on the service picker.

    // Step 3: service
    await user.click(
      await screen.findByRole("button", { name: /corte completo/i }),
    );

    // Step 4: slot — the slot's start is UTC 16:00 which renders as MX local
    // 10:00. The button's accessible name also includes the duration label
    // ("10:00 30 min"), so match on the time substring.
    await user.click(await screen.findByRole("button", { name: /10:00/ }));

    // Step 5: pet
    await user.click(await screen.findByRole("button", { name: /nala/i }));

    // Step 6: review → confirm
    await user.click(
      await screen.findByRole("button", { name: /confirmar reserva/i }),
    );

    // Success swaps in an animation that auto-navigates after ~2.8s.
    await waitFor(
      () => expect(screen.getByTestId("appointments")).toBeInTheDocument(),
      { timeout: 5000 },
    );

    expect(postedPayload).toMatchObject({
      business_unit: "bu-grooming",
      pet: "pet-1",
      scheduled_start: "2030-06-01T16:00:00Z",
      scheduled_end: "2030-06-01T17:00:00Z",
      channel: "web",
      items: [{ service: "srv-corte", resource: "res-1" }],
    });
  });

  it("redirects the user to /pets/new if they have no pets when reaching the slot step", async () => {
    server.use(
      http.get(`${API}/locations/`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/services/catalog/`, () =>
        HttpResponse.json(paginated([])),
      ),
      http.get(`${API}/pets/`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/appointments/slots/`, () =>
        HttpResponse.json(paginated([])),
      ),
    );

    // Seed the store through slot + location + service directly so we hit
    // the SlotPickerPage guard that checks for pets.
    useBookingFlowStore.setState({
      businessUnitCode: "GROOMING",
      location: {
        id: "loc-1",
        name: "Sucursal Polanco",
        address: "Polanco",
        businessUnitId: "bu-grooming",
        businessUnitName: "Grooming Polanco",
      },
      service: {
        id: "srv-1",
        name: "Corte",
        price: "450.00",
        durationMinutes: 60,
        requiresPet: true,
      },
      slot: null,
      pet: null,
      notes: "",
    });

    renderWizard("/book/slot");

    expect(
      await screen.findByTestId("pets-new"),
    ).toBeInTheDocument();
  });
});
